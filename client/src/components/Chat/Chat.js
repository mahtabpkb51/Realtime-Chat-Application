import React, { useEffect, useRef, useState } from "react";
import queryString from "query-string";
import io from "socket.io-client";

import TextContainer from "../TextContainer/TextContainer";
import Messages from "../Messages/Messages";
import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";

import "./Chat.css";

const ENDPOINT = "http://localhost:5000";

// ===================== CHAT COMPONENT =====================

const Chat = ({ location }) => {

  // ===================== STATES =====================

  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [avatar, setAvatar] = useState("👨‍💻");

  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [pinNotification, setPinNotification] = useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("chatTheme") || "dark"
  );

  // ===================== REFS =====================

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const notificationTimeoutsRef = useRef([]);
  const pinNotificationTimeoutRef = useRef(null);

  // ===================== SAVE THEME =====================

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  // ===================== SOCKET CONNECTION =====================

  useEffect(() => {

    const {
      name: userName,
      room: userRoom,
      avatar: userAvatar
    } = queryString.parse(location.search);

    setName(userName || "");
    setRoom(userRoom || "");
    setAvatar(userAvatar || "👨‍💻");

    const socket = io(ENDPOINT);

    socketRef.current = socket;

    // ===================== RECEIVE OLD MESSAGES =====================

    socket.on("oldMessages", oldMessages => {

      setMessages(
        oldMessages.map(msg => ({
          ...msg,

          id: msg._id
            ? String(msg._id)
            : msg.id,

          reactions: msg.reactions || {},
          reactionUsers: msg.reactionUsers || {},
          read: msg.read || false,
          edited: msg.edited || false,
          deleted: msg.deleted || false,
          pinned: msg.pinned || false,
          pinnedBy: msg.pinnedBy || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          fileSize: msg.fileSize || null,
          fileData: msg.fileData || null,
          audioData: msg.audioData || null,
          audioType: msg.audioType || null,
          audioSize: msg.audioSize || null
        }))
      );

    });

    // ===================== JOIN ROOM =====================

    socket.emit(
      "join",
      {
        name: userName,
        room: userRoom,
        avatar: userAvatar || "👨‍💻"
      },
      error => {

        if (error) {
          alert(error);
          socket.disconnect();
          return;
        }

      }
    );

    // ===================== RECEIVE TEXT MESSAGE =====================

    socket.on("message", msg => {

      setMessages(old => [
        ...old,
        {
          ...msg,
          reactions: msg.reactions || {},
          reactionUsers: msg.reactionUsers || {},
          read: msg.read || false
        }
      ]);


      // ===================== MARK MESSAGE READ =====================

      if (
        msg.id &&
        msg.user &&
        msg.user.toLowerCase() !==
        (userName || "").toLowerCase() &&
        msg.user.toLowerCase() !== "admin"
      ) {

        socket.emit("markMessageRead", {
          messageId: msg.id
        });

      }

    });

    // ===================== RECEIVE FILE =====================

    socket.on("fileMessage", msg => {

      setMessages(old => [
        ...old,
        {
          ...msg,
          reactions: msg.reactions || {},
          reactionUsers: msg.reactionUsers || {},
          read: msg.read || false
        }
      ]);

      if (
        msg.id &&
        msg.user !== userName
      ) {

        socket.emit("markMessageRead", {
          messageId: msg.id
        });

      }

    });

    // ===================== RECEIVE AUDIO =====================

    socket.on("audioMessage", msg => {

      setMessages(old => [
        ...old,
        {
          ...msg,
          reactions: msg.reactions || {},
          reactionUsers: msg.reactionUsers || {},
          read: msg.read || false
        }
      ]);

      if (
        msg.id &&
        msg.user !== userName
      ) {

        socket.emit("markMessageRead", {
          messageId: msg.id
        });

      }

    });

    // ===================== ROOM USERS =====================

    socket.on(
      "roomData",
      ({ users }) => {

        setUsers(users);

      }
    );

    // ===================== USER STATUS =====================

    socket.on(
      "userStatus",
      ({ name, status }) => {

        setUserStatuses(
          previousStatuses => ({
            ...previousStatuses,
            [name]: status
          })
        );

      }
    );

    // ===================== NOTIFICATION =====================

    socket.on(
      "notification",
      notification => {

        const notificationId =
          `${Date.now()}-${Math.random()}`;

        const newNotification = {
          ...notification,
          id: notificationId
        };

        setNotifications(
          previousNotifications => [
            ...previousNotifications,
            newNotification
          ]
        );

        // ===================== AUTO HIDE =====================

        const timeoutId = setTimeout(() => {

          setNotifications(
            previousNotifications =>
              previousNotifications.filter(
                item => item.id !== notificationId
              )
          );

          notificationTimeoutsRef.current =
            notificationTimeoutsRef.current.filter(
              id => id !== timeoutId
            );

        }, 3000);

        notificationTimeoutsRef.current.push(timeoutId);

      }
    );

    // ===================== TYPING =====================

    socket.on(
      "typing",
      user => {

        setTypingUsers(old =>
          old.includes(user)
            ? old
            : [...old, user]
        );

      }
    );

    socket.on(
      "stopTyping",
      user => {

        setTypingUsers(old =>
          old.filter(u => u !== user)
        );

      }
    );

    // ===================== READ RECEIPTS =====================

    socket.on(
      "messageRead",
      ({ messageId }) => {

        setMessages(old =>
          old.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                read: true
              }
              : msg
          )
        );

      }
    );

    // ===================== DELETE MESSAGE =====================

    socket.on(
      "messageDeleted",
      ({
        messageId,
        deleteForEveryone
      }) => {

        if (!deleteForEveryone) return;

        setMessages(old =>
          old.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                text: "This message was deleted",
                type: "deleted",
                deleted: true,
                fileData: null,
                fileName: null,
                audioData: null,
                replyTo: null
              }
              : msg
          )
        );

      }
    );

    // ===================== EDIT MESSAGE =====================

    socket.on(
      "messageEdited",
      ({
        messageId,
        newText
      }) => {

        setMessages(old =>
          old.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                text: newText,
                edited: true
              }
              : msg
          )
        );

      }
    );

    // ===================== MESSAGE REACTIONS =====================

    socket.on(
      "messageReaction",
      ({
        messageId,
        reactions
      }) => {

        setMessages(old =>
          old.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                reactions: reactions || {}
              }
              : msg
          )
        );

      }
    );

    // ===================== MESSAGE PIN =====================

    socket.on(
      "messagePinned",
      ({
        messageId,
        pinned,
        pinnedBy
      }) => {

        setMessages(old =>
          old.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                pinned: pinned === true,
                pinnedBy: pinned
                  ? pinnedBy
                  : null
              }
              : msg
          )
        );

      }
    );

    // ===================== PIN NOTIFICATION =====================

    socket.on(
      "pinNotification",
      notification => {

        if (!notification) {
          return;
        }

        setPinNotification(notification);

        clearTimeout(
          pinNotificationTimeoutRef.current
        );

        pinNotificationTimeoutRef.current =
          setTimeout(() => {
            setPinNotification(null);
          }, 3000);

      }
    );

    // ===================== CLEANUP =====================

    return () => {

      socket.off("message");
      socket.off("oldMessages");
      socket.off("fileMessage");
      socket.off("audioMessage");
      socket.off("roomData");
      socket.off("userStatus");
      socket.off("notification");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageRead");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("messageReaction");
      socket.off("messagePinned");
      socket.off("pinNotification");

      clearTimeout(
        typingTimeoutRef.current
      );

      clearTimeout(
        pinNotificationTimeoutRef.current
      );

      notificationTimeoutsRef.current.forEach(
        timeoutId => clearTimeout(timeoutId)
      );

      notificationTimeoutsRef.current = [];

      socket.disconnect();

      socketRef.current = null;

    };

  }, [location.search]);

  // ===================== TYPING =====================

  const handleMessageChange = value => {

    const nextValue =
      typeof value === "function"
        ? value(message)
        : value;

    setMessage(nextValue);

    const socket = socketRef.current;

    if (!socket || !name || !room) {
      return;
    }

    clearTimeout(
      typingTimeoutRef.current
    );

    if (nextValue.trim()) {

      socket.emit("typing", {
        name,
        room
      });

      typingTimeoutRef.current =
        setTimeout(() => {

          socket.emit(
            "stopTyping",
            {
              name,
              room
            }
          );

        }, 1500);

    } else {

      socket.emit(
        "stopTyping",
        {
          name,
          room
        }
      );

    }

  };

  // ===================== SEND MESSAGE =====================

  const sendMessage = event => {

    event.preventDefault();

    if (
      !message.trim() ||
      !socketRef.current
    ) {
      return;
    }

    socketRef.current.emit(
      "sendMessage",
      {
        text: message.trim(),

        replyTo: replyingTo
          ? {
            id: replyingTo.id,
            user: replyingTo.user,
            text: replyingTo.text,
            type: replyingTo.type,
            fileName: replyingTo.fileName
          }
          : null
      },

      error => {

        // ===================== SERVER ERROR =====================

        if (error) {
          alert(error);
          return;
        }

        // ===================== MESSAGE SENT =====================

        setMessage("");
        setReplyingTo(null);

        clearTimeout(
          typingTimeoutRef.current
        );

        socketRef.current.emit(
          "stopTyping",
          {
            name,
            room
          }
        );

      }
    );

  };

  // ===================== EDIT MESSAGE =====================

  const handleEditMessage = messageToEdit => {

    if (
      !messageToEdit ||
      messageToEdit.type !== "text"
    ) {
      return;
    }

    setEditingMessage(messageToEdit);
    setMessage(messageToEdit.text);

  };

  const cancelEdit = () => {

    setEditingMessage(null);
    setMessage("");

  };

  const saveEditedMessage = event => {

    event.preventDefault();

    if (
      !editingMessage ||
      !message.trim() ||
      !socketRef.current
    ) {
      return;
    }

    socketRef.current.emit(
      "editMessage",
      {
        messageId: editingMessage.id,
        newText: message.trim()
      }
    );

    setMessage("");
    setEditingMessage(null);

    clearTimeout(
      typingTimeoutRef.current
    );

    socketRef.current.emit(
      "stopTyping",
      {
        name,
        room
      }
    );

  };

  // ===================== SEND FILE =====================

  const sendFile = file => {

    const socket = socketRef.current;

    if (!socket || !file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {

      alert(
        "File size must be less than 2 MB."
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      socket.emit("sendFile", {
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result
      });

    };

    reader.onerror = () => {

      alert(
        "Unable to read this file."
      );

    };

    reader.readAsDataURL(file);

  };

  // ===================== SEND AUDIO =====================

  const sendAudio = audioData => {

    const socket = socketRef.current;

    if (!socket || !audioData) {
      return;
    }

    if (
      audioData.size >
      2 * 1024 * 1024
    ) {

      alert(
        "Voice message must be less than 2 MB."
      );

      return;
    }

    socket.emit(
      "sendAudio",
      audioData
    );

  };

  // ===================== REACTION =====================

  const handleReaction = (
    messageId,
    reaction
  ) => {

    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(
      "reactToMessage",
      {
        messageId,
        reaction
      }
    );

  };

  // ===================== PIN MESSAGE =====================

  const handlePinMessage = (
    messageId,
    pinned
  ) => {

    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(
      "pinMessage",
      {
        messageId,
        pinned
      }
    );

  };

  // ===================== REPLY =====================

  const handleReply = message => {

    setReplyingTo(message);
    setEditingMessage(null);

  };

  const cancelReply = () => {

    setReplyingTo(null);

  };

  // ===================== DELETE MESSAGE =====================

  const handleDeleteMessage = (
    messageId,
    deleteForEveryone
  ) => {

    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    // ===================== DELETE ONLY FOR ME =====================

    if (!deleteForEveryone) {

      socket.emit(
        "deleteMessage",
        {
          messageId,
          deleteForEveryone: false
        }
      );

      setMessages(old =>
        old.filter(
          msg => msg.id !== messageId
        )
      );

      return;
    }

    // ===================== DELETE FOR EVERYONE =====================

    socket.emit(
      "deleteMessage",
      {
        messageId,
        deleteForEveryone: true
      }
    );

  };

  // ===================== UI =====================

  return (
    <div className={`outerContainer ${theme}-theme`}>

      {/* ===================== NOTIFICATION POPUP ===================== */}

      {notifications.length > 0 && (
        <div className="notificationContainer">

          {notifications.map(
            notification => (

              <div
                key={notification.id}
                className={`notification ${notification.type === "join"
                  ? "joinNotification"
                  : "leaveNotification"
                  }`}
              >

                <span className="notificationIcon">
                  {notification.type === "join"
                    ? "🟢"
                    : "⚪"}
                </span>

                <span className="notificationMessage">
                  {notification.message}
                </span>

              </div>

            )
          )}

        </div>
      )}

      <div className="container">

        <InfoBar
          room={room}
          theme={theme}
          setTheme={setTheme}
        />

        <Messages
          messages={messages}
          name={name}
          onReaction={handleReaction}
          onReply={handleReply}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onPin={handlePinMessage}
        />

        {/* ===================== PIN NOTIFICATION ===================== */}

        {pinNotification && (
          <div className="chatPinNotification">

            <span className="chatPinNotificationIcon">
              📌
            </span>

            <span>
              {pinNotification.text}
            </span>

          </div>
        )}

        {typingUsers.length > 0 && (
          <div className="typingIndicator">

            <span className="typingDots">
              <span></span>
              <span></span>
              <span></span>
            </span>

            <span>
              {typingUsers.join(", ")}
              {typingUsers.length === 1
                ? " is"
                : " are"}{" "}
              typing...
            </span>

          </div>
        )}

        <Input
          message={message}
          setMessage={handleMessageChange}
          sendMessage={
            editingMessage
              ? saveEditedMessage
              : sendMessage
          }
          sendFile={sendFile}
          sendAudio={sendAudio}
          replyingTo={replyingTo}
          cancelReply={cancelReply}
          editingMessage={editingMessage}
          cancelEdit={cancelEdit}
        />

      </div>

      <TextContainer
        users={users}
        userStatuses={userStatuses}
      />

    </div>
  );
};

export default Chat;