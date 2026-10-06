const mongoose = require("mongoose");

// ===================== MESSAGE SCHEMA =====================

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true
    },

    user: {
      type: String,
      required: true
    },

    type: {
      type: String,
      default: "text"
    },

    text: {
      type: String,
      default: ""
    },

    time: {
      type: Date,
      default: Date.now
    },

    // ===================== REACTIONS =====================

    reactions: {
      type: Object,
      default: {}
    },

    reactionUsers: {
      type: Object,
      default: {}
    },

    // ===================== MESSAGE STATUS =====================

    read: {
      type: Boolean,
      default: false
    },

    edited: {
      type: Boolean,
      default: false
    },

    deleted: {
      type: Boolean,
      default: false
    },

    // ===================== DELETE FOR ME =====================

    deletedFor: {
      type: [String],
      default: []
    },

    // ===================== PIN =====================

    pinned: {
      type: Boolean,
      default: false
    },

    pinnedBy: {
      type: String,
      default: null
    },

    // ===================== REPLY =====================

    replyTo: {
      type: Object,
      default: null
    },

    // ===================== FILE DATA =====================

    fileName: {
      type: String,
      default: null
    },

    fileType: {
      type: String,
      default: null
    },

    fileSize: {
      type: Number,
      default: null
    },

    fileData: {
      type: String,
      default: null
    },

    // ===================== AUDIO DATA =====================

    audioData: {
      type: String,
      default: null
    },

    audioType: {
      type: String,
      default: null
    },

    audioSize: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);