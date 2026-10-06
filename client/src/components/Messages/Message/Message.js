import React, { useState } from "react";
import "./Message.css";

// ===================== MESSAGE COMPONENT =====================

const Message = ({
  message,
  name,
  searchText,
  onReaction,
  onReply,
  onDelete,
  onEdit,
  onPin
}) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const {
    id,
    user,
    text,
    type,
    time,
    reactions = {},
    read,
    replyTo,
    fileData,
    fileName,
    fileType,
    audioData,
    deleted,
    edited,
    pinned,
    pinnedBy
  } = message;

  // ===================== MESSAGE STATUS =====================

  const isSentByCurrentUser =
    user &&
    name &&
    user.toLowerCase() ===
    name.toLowerCase();

  const isDeleted =
    deleted === true ||
    type === "deleted";

  const isEditable =
    isSentByCurrentUser &&
    type === "text" &&
    !isDeleted;

  // ===================== MESSAGE DATA =====================

  const safeText = text || "";

  // ===================== SEARCH HIGHLIGHT =====================

  const renderHighlightedText = () => {
    if (
      !searchText ||
      !searchText.trim() ||
      !safeText
    ) {
      return safeText;
    }

    const searchValue =
      searchText.trim();

    const escapedSearchValue =
      searchValue.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const parts = safeText.split(
      new RegExp(
        `(${escapedSearchValue})`,
        "gi"
      )
    );

    return parts.map(
      (part, index) => {
        if (
          part.toLowerCase() ===
          searchValue.toLowerCase()
        ) {
          return (
            <mark
              className="searchHighlight"
              key={index}
            >
              {part}
            </mark>
          );
        }

        return (
          <React.Fragment key={index}>
            {part}
          </React.Fragment>
        );
      }
    );
  };

  // ===================== MESSAGE DATE & TIME =====================

  const formatMessageTime = messageTime => {
    if (!messageTime) {
      return "";
    }

    const date = new Date(messageTime);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      }
    );
  };

  const safeTime =
    formatMessageTime(time);

  // ===================== PIN NOTIFICATION =====================

  if (type === "pinNotification") {
    return (
      <div className="pinNotificationWrapper">

        <div className="pinNotification">

          <span className="pinNotificationIcon">
            📌
          </span>

          <span className="pinNotificationText">
            {safeText.replace("📌 ", "")}
          </span>

        </div>

      </div>
    );
  }

  // ===================== FILE DATA =====================

  const isImage =
    fileType &&
    fileType.startsWith("image/");

  const isAudio =
    type === "audio" ||
    !!audioData;

  const fileSize = message.fileSize
    ? `${(
      message.fileSize / 1024
    ).toFixed(1)} KB`
    : "";

 // ===================== REACTIONS =====================

const reactionItems = Object.entries(
  reactions || {}
).filter(
  ([, count]) =>
    typeof count === "number" &&
    count > 0
);

const handleReaction = reaction => {
  if (
    onReaction &&
    id &&
    !isDeleted
  ) {
    onReaction(id, reaction);
    setShowReactions(false);
  }
};

const reactionsUI =
  !isDeleted && (
    <div
      className="reactionWrapper"
      onClick={event =>
        event.stopPropagation()
      }
    >

      {showReactions && (
        <div className="reactions">

          <button
            type="button"
            onClick={() =>
              handleReaction("❤️")
            }
          >
            ❤️
          </button>

          <button
            type="button"
            onClick={() =>
              handleReaction("😂")
            }
          >
            😂
          </button>

          <button
            type="button"
            onClick={() =>
              handleReaction("👍")
            }
          >
            👍
          </button>

          <button
            type="button"
            onClick={() =>
              handleReaction("😮")
            }
          >
            😮
          </button>

        </div>
      )}

      {reactionItems.map(
        ([emoji, count]) => (
          <span
            className="reactionCount"
            key={emoji}
          >
            {emoji} {count}
          </span>
        )
      )}

    </div>
  );

  // ===================== REPLY =====================

  const handleReply = () => {
    if (
      onReply &&
      !isDeleted
    ) {
      onReply(message);
    }
  };

  const replyButton =
    !isDeleted && (
      <button
        type="button"
        className="replyButton"
        onClick={handleReply}
      >
        ↩ Reply
      </button>
    );

  const replyPreview =
    replyTo &&
    !isDeleted && (
      <div className="replyPreview">

        <strong>
          {replyTo.user}
        </strong>

        <span>
          {replyTo.type === "file"
            ? `📎 ${replyTo.fileName ||
            "File"
            }`
            : replyTo.type === "audio"
              ? "🎤 Voice message"
              : replyTo.text ||
              "Message"}
        </span>

      </div>
    );

  // ===================== EDIT =====================

  const editButton =
    isEditable && (
      <button
        type="button"
        className="editButton"
        onClick={() => {
          if (onEdit) {
            onEdit(message);
          }

          setShowDeleteMenu(false);
        }}
      >
        ✏️ Edit
      </button>
    );

  // ===================== PIN =====================

  const pinButton =
    !isDeleted && (
      <button
        type="button"
        className="pinButton"
        onClick={() => {
          if (onPin) {
            onPin(
              id,
              !pinned
            );
          }

          setShowDeleteMenu(false);
        }}
      >
        {pinned
          ? "📌 Unpin message"
          : "📌 Pin message"}
      </button>
    );

  // ===================== DELETE =====================

  const deleteMenu =
    isSentByCurrentUser &&
    !isDeleted && (
      <div className="deleteMenuWrapper">

        <button
          type="button"
          className="deleteButton"
          onClick={() =>
            setShowDeleteMenu(
              previous =>
                !previous
            )
          }
        >
          ⋮
        </button>

        {showDeleteMenu && (
          <div className="deleteMenu">

            {editButton}

            {pinButton}

            <button
              type="button"
              onClick={() => {
                if (onDelete) {
                  onDelete(
                    id,
                    false
                  );
                }

                setShowDeleteMenu(false);
              }}
            >
              🗑 Delete for me
            </button>

            <button
              type="button"
              className="deleteEveryone"
              onClick={() => {
                if (onDelete) {
                  onDelete(
                    id,
                    true
                  );
                }

                setShowDeleteMenu(false);
              }}
            >
              🗑 Delete for everyone
            </button>

          </div>
        )}

      </div>
    );

  // ===================== MESSAGE ACTIONS =====================

  const messageActions =
    !isDeleted && (
      <div className="messageActions">
        {replyButton}
        {reactionsUI}
        {deleteMenu}
      </div>
    );

  // ===================== MESSAGE CONTENT =====================

  const deletedMessage =
    isDeleted && (
      <div className="deletedMessageBubble">
        🚫 This message was deleted
      </div>
    );

  const textMessage =
    !isDeleted &&
    type !== "file" &&
    type !== "audio" &&
    !fileData &&
    !audioData && (
      <p className="messageText">
        {renderHighlightedText()}

        {edited && (
          <span className="editedLabel">
            {" "} (edited)
          </span>
        )}
      </p>
    );

  const imageMessage =
    !isDeleted &&
    fileData &&
    isImage && (
      <img
        src={fileData}
        alt={
          fileName ||
          "Shared image"
        }
        className="sharedImage"
        onClick={() =>
          setShowImagePreview(true)
        }
      />
    );

  const fileMessage =
    !isDeleted &&
    fileData &&
    !isImage && (
      <a
        href={fileData}
        download={
          fileName || "download"
        }
        className="sharedFile"
      >
        📎{" "}
        {fileName ||
          "Download file"}

        {fileSize && (
          <span className="fileSize">
            {" "}({fileSize})
          </span>
        )}
      </a>
    );

  const audioMessage =
    !isDeleted &&
    (audioData || isAudio) && (
      <audio
        controls
        className="audioMessage"
        src={
          audioData || fileData
        }
      />
    );

  // ===================== READ RECEIPT =====================

  const readStatus =
    isSentByCurrentUser &&
    !isDeleted && (
      <span className="readStatus">
        {read ? "✓✓" : "✓"}
      </span>
    );

  // ===================== SENT MESSAGE =====================

  if (isSentByCurrentUser) {
    return (
      <>
        <div className="messageContainer justifyEnd">

          <div
            className="messageBox backgroundBlue"
            onClick={() =>
              setShowReactions(
                previous => !previous
              )
            }
          >

            <div className="messageTextContainer">

              {pinned && !isDeleted && (
                <div className="pinnedMessageIndicator">
                  📌 Pinned
                  {pinnedBy
                    ? ` by ${pinnedBy}`
                    : ""}
                </div>
              )}

              {replyPreview}
              {deletedMessage}
              {textMessage}
              {imageMessage}
              {fileMessage}
              {audioMessage}

              <span className="messageTime">
                {safeTime}
              </span>

            </div>

          </div>

          <div className="sentMessageBottom">

            {messageActions}
            {readStatus}

          </div>

        </div>

        {showImagePreview &&
          imageMessage && (
            <div
              className="imagePreviewOverlay"
              onClick={() =>
                setShowImagePreview(
                  false
                )
              }
            >
              <img
                src={fileData}
                alt={
                  fileName ||
                  "Preview"
                }
                className="imagePreview"
              />
            </div>
          )}

      </>
    );
  }

  // ===================== RECEIVED MESSAGE =====================

  return (
    <>
      <div className="messageContainer justifyStart">

        <div
          className="messageBox backgroundLight"
          onClick={() =>
            setShowReactions(
              previous => !previous
            )
          }
        >

          <div className="messageTextContainer">

            <p className="messageUser">
              {user}
            </p>

            {replyPreview}
            {deletedMessage}
            {textMessage}
            {imageMessage}
            {fileMessage}
            {audioMessage}

            <span className="messageTime">
              {safeTime}
            </span>

          </div>

        </div>

        {messageActions}

      </div>

      {showImagePreview &&
        imageMessage && (
          <div
            className="imagePreviewOverlay"
            onClick={() =>
              setShowImagePreview(
                false
              )
            }
          >
            <img
              src={fileData}
              alt={
                fileName ||
                "Preview"
              }
              className="imagePreview"
            />
          </div>
        )}

    </>
  );
};

export default Message;