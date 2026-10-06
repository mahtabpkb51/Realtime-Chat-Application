import React, {
  useState,
  lazy,
  Suspense,
  useRef
} from "react";

import "./Input.css";

// ===================== EMOJI PICKER =====================

const EmojiPicker = lazy(() =>
  import("emoji-picker-react")
);

// ===================== INPUT COMPONENT =====================

const Input = ({
  message,
  setMessage,
  sendMessage,
  sendFile,
  sendAudio,
  replyTo,
  cancelReply,
  editingMessage,
  cancelEdit
}) => {

  // ===================== CONSTANTS =====================

  const MAX_MESSAGE_LENGTH = 2000;

  // ===================== STATES =====================

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  // ===================== REFS =====================

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // ===================== EMOJI =====================

  const handleEmojiClick = emojiData => {

    setMessage(previousMessage => {

      const newMessage =
        previousMessage + emojiData.emoji;

      if (
        newMessage.length >
        MAX_MESSAGE_LENGTH
      ) {
        return previousMessage;
      }

      return newMessage;

    });

  };

  // ===================== KEYBOARD SHORTCUTS =====================

  const handleKeyDown = event => {

    if (!editingMessage) {
      return;
    }

    // Enter = Save edit

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      if (message.trim()) {
        sendMessage(event);
      }

      return;
    }

    // Escape = Cancel edit

    if (event.key === "Escape") {

      event.preventDefault();

      if (cancelEdit) {
        cancelEdit();
      }

    }

  };

  // ===================== FILE SHARING =====================

  const handleFileButton = () => {

    if (editingMessage) {
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }

  };

  const handleFileChange = event => {

    const file = event.target.files[0];

    if (!file || !sendFile) {
      return;
    }

    sendFile(file);

    event.target.value = "";

  };

  // ===================== START RECORDING =====================

  const startRecording = async () => {

    if (editingMessage) {
      return;
    }

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {

        if (event.data.size > 0) {

          audioChunksRef.current.push(
            event.data
          );

        }

      };

      mediaRecorder.onstop = () => {

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              mediaRecorder.mimeType ||
              "audio/webm"
          }
        );

        const reader = new FileReader();

        reader.onloadend = () => {

          if (sendAudio) {

            sendAudio({
              data: reader.result,
              type:
                audioBlob.type ||
                "audio/webm",
              size: audioBlob.size
            });

          }

        };

        reader.readAsDataURL(audioBlob);

        stream
          .getTracks()
          .forEach(track => track.stop());

      };

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current =
        setInterval(() => {

          setRecordingTime(
            previousTime =>
              previousTime + 1
          );

        }, 1000);

    } catch (error) {

      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Microphone permission is required."
      );

    }

  };

  // ===================== STOP RECORDING =====================

  const stopRecording = () => {

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {

      mediaRecorderRef.current.stop();

    }

    setIsRecording(false);

    if (recordingTimerRef.current) {

      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;

    }

  };

  // ===================== RECORDING TIME =====================

  const formatRecordingTime = seconds => {

    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;

  };

  // ===================== SUBMIT MESSAGE =====================

  const handleSubmit = event => {

    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    if (
      message.trim().length >
      MAX_MESSAGE_LENGTH
    ) {

      alert(
        "Message cannot exceed 2000 characters."
      );

      return;
    }

    sendMessage(event);

    setShowEmojiPicker(false);

  };

  // ===================== REPLY PREVIEW =====================

  const getReplyText = () => {

    if (!replyTo) {
      return "";
    }

    if (replyTo.type === "image") {
      return "📷 Image";
    }

    if (replyTo.type === "file") {
      return `📎 ${
        replyTo.fileName || "File"
      }`;
    }

    if (replyTo.type === "audio") {
      return "🎤 Voice message";
    }

    return replyTo.text || "Message";

  };

  // ===================== EDIT PREVIEW =====================

  const getEditText = () => {

    if (!editingMessage) {
      return "";
    }

    return editingMessage.text || "";

  };

  // ===================== INPUT UI =====================

  return (

    <form
      className="form"
      onSubmit={handleSubmit}
    >

      {/* ===================== REPLY PREVIEW ===================== */}

      {replyTo && !editingMessage && (

        <div className="inputReplyPreview">

          <div className="inputReplyInfo">

            <span className="inputReplyTitle">
              ↩️ Replying to{" "}
              {replyTo.user}
            </span>

            <span className="inputReplyText">
              {getReplyText()}
            </span>

          </div>

          <button
            type="button"
            className="cancelReplyButton"
            onClick={cancelReply}
          >
            ✕
          </button>

        </div>

      )}

      {/* ===================== EDIT PREVIEW ===================== */}

      {editingMessage && (

        <div className="inputEditPreview">

          <div className="inputEditInfo">

            <span className="inputEditTitle">
              ✏️ Editing message
            </span>

            <span className="inputEditText">
              {getEditText()}
            </span>

          </div>

          <button
            type="button"
            className="cancelEditButton"
            onClick={cancelEdit}
          >
            ✕
          </button>

        </div>

      )}

      {/* ===================== INPUT WRAPPER ===================== */}

      <div className="inputWrapper">

        {/* ===================== FILE BUTTON ===================== */}

        {!editingMessage &&
          !isRecording && (

            <>

              <button
                type="button"
                className="fileButton"
                onClick={handleFileButton}
                title="Attach file"
              >
                📎
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hiddenFileInput"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
              />

            </>

          )}

        {/* ===================== EMOJI BUTTON ===================== */}

        {!isRecording && (

          <button
            type="button"
            className="emojiButton"
            onClick={() =>
              setShowEmojiPicker(
                previous =>
                  !previous
              )
            }
            title="Emoji"
          >
            😊
          </button>

        )}

        {/* ===================== TEXT INPUT ===================== */}

        {!isRecording ? (

          <input
            className="input"
            type="text"
            value={message}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={event =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? "Edit your message..."
                : "Type a message..."
            }
            autoFocus={!!editingMessage}
          />

        ) : (

          <div className="recordingBox">

            <span className="recordingDot" />

            <span>
              Recording...
            </span>

            <span className="recordingTime">
              {formatRecordingTime(
                recordingTime
              )}
            </span>

          </div>

        )}

        {/* ===================== EMOJI PICKER ===================== */}

        {showEmojiPicker &&
          !isRecording && (

            <div className="emojiPicker">

              <Suspense
                fallback={
                  <div className="emojiLoading">
                    Loading emojis...
                  </div>
                }
              >

                <EmojiPicker
                  onEmojiClick={
                    handleEmojiClick
                  }
                  theme="dark"
                />

              </Suspense>

            </div>

          )}

      </div>

      {/* ===================== VOICE BUTTON ===================== */}

      {!editingMessage && (

        <>

          {!isRecording ? (

            <button
              type="button"
              className="voiceButton"
              onClick={startRecording}
              title="Record voice"
            >
              🎤
            </button>

          ) : (

            <button
              type="button"
              className="stopVoiceButton"
              onClick={stopRecording}
              title="Stop recording"
            >
              ⏹️
            </button>

          )}

        </>

      )}

      {/* ===================== SEND / SAVE BUTTON ===================== */}

      <button
        type="submit"
        className="sendButton"
        disabled={
          !message.trim() ||
          message.trim().length >
            MAX_MESSAGE_LENGTH ||
          isRecording
        }
      >

        <span className="sendIcon">
          {editingMessage
            ? "💾"
            : "➤"}
        </span>

        <span>
          {editingMessage
            ? "Save"
            : "Send"}
        </span>

      </button>

    </form>

  );

};

export default Input;