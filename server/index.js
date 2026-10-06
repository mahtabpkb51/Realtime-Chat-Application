require("dotenv").config();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const socketio = require("socket.io");
const cors = require("cors");


const app = express();

// ===================== MONGODB CONNECTION =====================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(error => {
    console.error("MongoDB connection error:", error);
  });



const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./users");

const router = require("./router");

const server = http.createServer(app);

const io = socketio(server, {
  maxHttpBufferSize: 5 * 1024 * 1024
});

const messageReactions = {};

app.use(cors());
app.use(router);

io.on("connect", socket => {

  // ===================== JOIN ROOM =====================

  socket.on(
    "join",
    async ({ name, room, avatar }, callback) => {

      // ===================== JOIN VALIDATION =====================

      const cleanName =
        typeof name === "string"
          ? name.trim()
          : "";

      const cleanRoom =
        typeof room === "string"
          ? room.trim()
          : "";

      const nameRegex =
        /^[a-zA-Z0-9 ]+$/;

      const roomRegex =
        /^[a-zA-Z0-9_-]+$/;

      if (
        cleanName.length < 2 ||
        cleanName.length > 20 ||
        !nameRegex.test(cleanName)
      ) {
        return callback(
          "Name must be 2-20 characters and contain only letters, numbers and spaces."
        );
      }

      if (
        cleanRoom.length < 2 ||
        cleanRoom.length > 20 ||
        !roomRegex.test(cleanRoom)
      ) {
        return callback(
          "Room must be 2-20 characters and contain only letters, numbers, _ or -."
        );
      }

      name = cleanName;
      room = cleanRoom;

      const { error, user } = addUser({
        id: socket.id,
        name,
        room,
        avatar
      });

      if (error) {
        return callback(error);
      }

      socket.join(user.room);

      // ===================== LOAD OLD MESSAGES =====================

      try {
        const oldMessages = await Message
          .find({
            room: user.room,
            deletedFor: {
              $ne: user.name
            }
          })
          .sort({ time: 1 })
          .limit(100);

        socket.emit("oldMessages", oldMessages);
      } catch (error) {
        console.error("Load messages error:", error);
      }

      // ===================== WELCOME MESSAGE =====================

      socket.emit("message", {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        user: "admin",
        type: "text",
        text: `${user.name}, welcome to room ${user.room}.`,
        time: new Date().toISOString(),
        reactions: {},
        read: true,
        replyTo: null
      });

      // ===================== USER JOINED =====================

      socket.broadcast.to(user.room).emit(
        "message",
        {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          user: "admin",
          type: "text",
          text: `${user.name} has joined!`,
          time: new Date().toISOString(),
          reactions: {},
          read: true,
          replyTo: null
        }
      );

      // ===================== ROOM USERS =====================

      io.to(user.room).emit(
        "roomData",
        {
          room: user.room,
          users: getUsersInRoom(user.room)
        }
      );

      // ===================== ONLINE STATUS =====================

      io.to(user.room).emit(
        "userStatus",
        {
          name: user.name,
          status: "online"
        }
      );

      // ===================== JOIN NOTIFICATION =====================

      io.to(user.room).emit(
        "notification",
        {
          type: "join",
          message: `${user.name} joined the room`
        }
      );

      callback();
    }
  );

  // ===================== SEND MESSAGE =====================

  socket.on(
    "sendMessage",
    async (messageData, callback) => {

      const user = getUser(socket.id);

      if (!user) {
        if (callback) {
          callback("User is not connected.");
        }
        return;
      }

      const text =
        typeof messageData === "string"
          ? messageData
          : messageData &&
            typeof messageData.text === "string"
            ? messageData.text
            : "";

      if (!text.trim()) {
        if (callback) {
          callback("Message cannot be empty.");
        }
        return;
      }

      // ===================== MESSAGE SANITIZATION =====================

      const sanitizedText = text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      // ===================== MESSAGE LENGTH =====================

      if (text.trim().length > 2000) {
        if (callback) {
          callback(
            "Message cannot exceed 2000 characters."
          );
        }
        return;
      }

      const newMessage = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        user: user.name,
        type: "text",
        text: sanitizedText.trim(),
        time: new Date().toISOString(),
        reactions: {},
        read: false,
        replyTo:
          messageData &&
            typeof messageData === "object"
            ? messageData.replyTo || null
            : null
      };

      // ===================== SAVE MESSAGE TO MONGODB =====================

      try {
        const savedMessage = await Message.create({
          room: user.room,
          user: user.name,
          type: "text",
          text: newMessage.text,
          time: newMessage.time,
          reactions: {},
          reactionUsers: {},
          read: false,
          edited: false,
          deleted: false,
          pinned: false,
          pinnedBy: null,
          replyTo: newMessage.replyTo
        });

        newMessage.id =
          String(savedMessage._id);
      } catch (error) {
        console.error("Message save error:", error);

        if (callback) {
          callback("Failed to save message.");
        }

        return;
      }

      // ===================== SEND MESSAGE =====================

      io.to(user.room).emit(
        "message",
        newMessage
      );

      if (callback) {
        callback();
      }
    }
  );

  // ===================== MESSAGE READ RECEIPT =====================

  socket.on(
    "markMessageRead",
    async ({ messageId } = {}) => {

      const user = getUser(socket.id);

      if (!user || !messageId) {
        return;
      }

      try {

        const message =
          await Message.findOneAndUpdate(
            {
              _id: messageId,
              room: user.room
            },
            {
              $set: {
                read: true
              }
            },
            {
              new: true
            }
          );

        if (!message) {
          return;
        }

        io.to(user.room).emit(
          "messageRead",
          {
            messageId,
            readBy: user.name
          }
        );

      }
      catch (error) {

        console.error(
          "Read message error:",
          error
        );

      }
    }
  );


  // ===================== DELETE MESSAGE =====================

  socket.on(
    "deleteMessage",
    async ({
      messageId,
      deleteForEveryone
    } = {}) => {

      const user = getUser(socket.id);

      if (!user || !messageId) {
        return;
      }

      try {

        // ===================== DELETE FOR ME =====================

        if (!deleteForEveryone) {

          const message =
            await Message.findOneAndUpdate(
              {
                _id: messageId,
                room: user.room
              },
              {
                $addToSet: {
                  deletedFor: user.name
                }
              },
              {
                new: true
              }
            );

          if (!message) {
            return;
          }

          socket.emit(
            "messageDeleted",
            {
              messageId,
              deleteForEveryone: false
            }
          );

          return;
        }

        // ===================== DELETE FOR EVERYONE =====================

        const message =
          await Message.findOneAndUpdate(
            {
              _id: messageId,
              room: user.room
            },
            {
              $set: {
                text: "This message was deleted",
                type: "deleted",
                deleted: true,
                fileData: null,
                fileName: null,
                fileType: null,
                fileSize: null,
                audioData: null,
                audioType: null,
                audioSize: null,
                replyTo: null,
                reactions: {},
                reactionUsers: {},
                pinned: false,
                pinnedBy: null
              }
            },
            {
              new: true
            }
          );

        if (!message) {
          return;
        }

        io.to(user.room).emit(
          "messageDeleted",
          {
            messageId,
            deletedBy: user.name,
            deleteForEveryone: true
          }
        );

      }
      catch (error) {

        console.error(
          "Delete message error:",
          error
        );

      }
    }
  );

  // ===================== EDIT MESSAGE =====================

  socket.on(
    "editMessage",
    async ({
      messageId,
      newText
    } = {}) => {

      const user = getUser(socket.id);

      if (!user || !messageId) {
        return;
      }

      if (
        typeof newText !== "string" ||
        !newText.trim()
      ) {
        return;
      }

      const editedText =
        newText.trim();

      if (
        editedText.length > 2000
      ) {
        return;
      }

      try {

        const message =
          await Message.findOneAndUpdate(
            {
              _id: messageId,
              room: user.room,
              user: user.name,
              type: "text",
              deleted: {
                $ne: true
              }
            },
            {
              $set: {
                text: editedText,
                edited: true
              }
            },
            {
              new: true
            }
          );

        if (!message) {
          return;
        }

        io.to(user.room).emit(
          "messageEdited",
          {
            messageId,
            newText: editedText,
            editedBy: user.name
          }
        );

      }
      catch (error) {

        console.error(
          "Edit message error:",
          error
        );

      }
    }
  );


  // ===================== PIN MESSAGE =====================

  socket.on(
    "pinMessage",
    async ({
      messageId,
      pinned
    } = {}) => {

      const user = getUser(socket.id);

      if (!user || !messageId) {
        return;
      }

      const isPinned =
        pinned === true;

      try {

        const message =
          await Message.findOneAndUpdate(
            {
              _id: messageId,
              room: user.room,
              deleted: {
                $ne: true
              }
            },
            {
              $set: {
                pinned: isPinned,
                pinnedBy: isPinned
                  ? user.name
                  : null
              }
            },
            {
              new: true
            }
          );

        if (!message) {
          return;
        }

        io.to(user.room).emit(
          "messagePinned",
          {
            messageId,
            pinned: isPinned,
            pinnedBy: isPinned
              ? user.name
              : null
          }
        );

        // ===================== PIN NOTIFICATION =====================

        io.to(user.room).emit(
          "pinNotification",
          {
            text: isPinned
              ? `📌 ${user.name} pinned a message.`
              : `📌 ${user.name} unpinned a message.`,

            time:
              new Date().toISOString()
          }
        );

      }
      catch (error) {

        console.error(
          "Pin message error:",
          error
        );

      }
    }
  );

  // ===================== SEND FILE =====================

  socket.on(
    "sendFile",
    async (fileData) => {

      const user = getUser(socket.id);

      if (!user) {
        return;
      }

      if (
        !fileData ||
        !fileData.data ||
        typeof fileData.name !== "string" ||
        !fileData.name.trim()
      ) {
        return;
      }

      // ===================== FILE SIZE =====================

      const maxFileSize =
        2 * 1024 * 1024;

      if (
        typeof fileData.size !== "number" ||
        fileData.size <= 0
      ) {
        return;
      }

      if (fileData.size > maxFileSize) {

        console.log(
          "File too large.");

        return;
      }

      // ===================== ALLOWED FILE TYPES =====================

      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];

      const isImage =
        typeof fileData.type === "string" &&
        fileData.type.startsWith("image/");

      const isAllowedDocument =
        allowedTypes.includes(
          fileData.type
        );

      if (
        !isImage &&
        !isAllowedDocument
      ) {

        console.log(
          "File type not allowed:",
          fileData.type
        );

        return;
      }

      // ===================== CREATE FILE MESSAGE =====================

      const newFileMessage = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        user: user.name,
        type: "file",
        fileName: fileData.name.trim(),
        fileType: fileData.type,
        fileSize: fileData.size,
        fileData: fileData.data,
        time: new Date().toISOString(),
        reactions: {},
        read: false,
        replyTo: null
      };

      // ===================== SAVE FILE TO MONGODB =====================

      try {
        const savedFileMessage =
          await Message.create({
            room: user.room,
            user: user.name,
            type: "file",
            text: "",
            time: newFileMessage.time,
            reactions: {},
            reactionUsers: {},
            read: false,
            edited: false,
            deleted: false,
            pinned: false,
            pinnedBy: null,
            replyTo: null,

            fileName: newFileMessage.fileName,
            fileType: newFileMessage.fileType,
            fileSize: newFileMessage.fileSize,
            fileData: newFileMessage.fileData
          });

        newFileMessage.id =
          String(savedFileMessage._id);
      }
      catch (error) {
        console.error("File save error:", error);
        return;
      }

      console.log(
        "FILE RECEIVED:",
        fileData.name,
        "FROM:",
        user.name
      );

      // ===================== SEND FILE =====================

      io.to(user.room).emit(
        "fileMessage",
        newFileMessage
      );
    }
  );

  // ===================== SEND AUDIO =====================

  socket.on(
    "sendAudio",
    async (audioData) => {

      const user = getUser(socket.id);

      if (!user) {
        return;
      }

      if (
        !audioData ||
        !audioData.data
      ) {
        return;
      }

      // ===================== AUDIO TYPE =====================

      if (
        typeof audioData.type !== "string" ||
        !audioData.type.startsWith("audio/")
      ) {
        console.log(
          "Invalid audio type:",
          audioData.type
        );

        return;
      }

      // ===================== AUDIO SIZE =====================

      const maxAudioSize =
        2 * 1024 * 1024;

      if (
        typeof audioData.size !== "number" ||
        audioData.size <= 0
      ) {
        return;
      }

      if (
        audioData.size > maxAudioSize
      ) {
        console.log(
          "Audio too large."
        );

        return;
      }

      // ===================== CREATE AUDIO MESSAGE =====================

      const newAudioMessage = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

        user: user.name,

        type: "audio",

        audioData: audioData.data,

        audioType:
          audioData.type ||
          "audio/webm",

        audioSize:
          audioData.size,

        time:
          new Date().toISOString(),

        reactions: {},

        read: false,

        replyTo: null
      };

      // ===================== SAVE AUDIO TO MONGODB =====================

      try {

        const savedAudioMessage =
          await Message.create({
            room: user.room,

            user: user.name,

            type: "audio",

            text: "",

            time:
              newAudioMessage.time,

            reactions: {},

            reactionUsers: {},

            read: false,

            edited: false,

            deleted: false,

            pinned: false,

            pinnedBy: null,

            replyTo: null,

            audioData:
              newAudioMessage.audioData,

            audioType:
              newAudioMessage.audioType,

            audioSize:
              newAudioMessage.audioSize
          });

        newAudioMessage.id =
          String(savedAudioMessage._id);

      }
      catch (error) {

        console.error(
          "Audio save error:",
          error
        );

        return;
      }

      console.log(
        "AUDIO RECEIVED FROM:",
        user.name
      );

      // ===================== SEND AUDIO =====================

      io.to(user.room).emit(
        "audioMessage",
        newAudioMessage
      );
    }
  );


  // ===================== MESSAGE REACTION =====================

  socket.on(
    "reactToMessage",
    async ({ messageId, reaction } = {}) => {

      const user = getUser(socket.id);

      if (!user || !messageId) {
        return;
      }

      // ===================== REACTION VALIDATION =====================

      const allowedReactions = ["❤️", "😂", "👍", "😮"];

      if (
        !allowedReactions.includes(reaction)
      ) {
        return;
      }

      // ===================== FIND MESSAGE =====================

      const message =
        await Message.findOne({
          _id: messageId,
          room: user.room
        });

      if (!message) {
        return;
      }

      // ===================== CURRENT REACTION USERS =====================

      const oldReactionUsers =
        message.reactionUsers
          ? message.reactionUsers.toObject
            ? message.reactionUsers.toObject()
            : message.reactionUsers
          : {};

      const reactionUsers = {};

      Object.keys(oldReactionUsers).forEach(
        emoji => {

          if (
            Array.isArray(
              oldReactionUsers[emoji]
            )
          ) {
            reactionUsers[emoji] = [
              ...oldReactionUsers[emoji]
            ];
          }
        }
      );

      // ===================== FIND USER OLD REACTION =====================

      let previousReaction = null;

      Object.keys(reactionUsers).forEach(
        emoji => {

          if (
            reactionUsers[emoji].includes(
              user.id
            )
          ) {

            previousReaction = emoji;

            reactionUsers[emoji] =
              reactionUsers[emoji].filter(
                userId =>
                  userId !== user.id
              );
          }
        }
      );

      // ===================== SAME REACTION = REMOVE =====================

      if (
        previousReaction === reaction
      ) {

        // User already selected this emoji.
        // It is now removed.

        delete reactionUsers[reaction];

      } else {

        // ===================== REMOVE EMPTY REACTIONS =====================

        Object.keys(reactionUsers).forEach(
          emoji => {

            if (
              reactionUsers[emoji].length === 0
            ) {
              delete reactionUsers[emoji];
            }
          }
        );

        // ===================== ADD NEW REACTION =====================

        reactionUsers[reaction] = [
          user.id
        ];
      }

      // ===================== CREATE REACTION COUNTS =====================

      const reactionCounts = {};

      Object.keys(reactionUsers).forEach(
        emoji => {

          if (
            reactionUsers[emoji].length > 0
          ) {

            reactionCounts[emoji] =
              reactionUsers[emoji].length;
          }
        }
      );

      // ===================== SAVE TO MONGODB =====================

      message.reactionUsers =
        reactionUsers;

      message.reactions =
        reactionCounts;

      await message.save();

      // ===================== SEND UPDATED REACTION =====================

      io.to(user.room).emit(
        "messageReaction",
        {
          messageId,
          reactions: reactionCounts
        }
      );
    }
  );

  // ===================== TYPING INDICATOR =====================

  socket.on(
    "typing",
    ({ name } = {}) => {

      const user = getUser(socket.id);

      if (!user) {
        return;
      }

      console.log(
        "TYPING:",
        user.name,
        "in room:",
        user.room
      );

      socket.broadcast
        .to(user.room)
        .emit(
          "typing",
          user.name
        );
    }
  );

  // ===================== STOP TYPING =====================

  socket.on(
    "stopTyping",
    ({ name } = {}) => {

      const user = getUser(socket.id);

      if (!user) {
        return;
      }

      console.log(
        "STOP TYPING:",
        user.name,
        "in room:",
        user.room
      );

      socket.broadcast
        .to(user.room)
        .emit(
          "stopTyping",
          user.name
        );
    }
  );

  // ===================== DISCONNECT =====================

  socket.on(
    "disconnect",
    () => {

      const user = removeUser(socket.id);

      if (!user) {
        return;
      }

      // ===================== OFFLINE STATUS =====================

      io.to(user.room).emit(
        "userStatus",
        {
          name: user.name,
          status: "offline"
        }
      );

      // ===================== LEAVE NOTIFICATION =====================

      io.to(user.room).emit(
        "notification",
        {
          type: "leave",
          message: `${user.name} left the room`
        }
      );

      // ===================== LEAVE MESSAGE =====================

      io.to(user.room).emit(
        "message",
        {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          user: "Admin",
          type: "text",
          text: `${user.name} has left.`,
          time: new Date().toISOString(),
          reactions: {},
          read: true,
          replyTo: null
        }
      );

      // ===================== UPDATED ROOM USERS =====================

      io.to(user.room).emit(
        "roomData",
        {
          room: user.room,
          users: getUsersInRoom(
            user.room
          )
        }
      );
    }
  );

});

// ===================== START SERVER =====================

server.listen(
  process.env.PORT || 5000,
  () => {

    console.log(
      "Server has started on port 5000."
    );

  }
);