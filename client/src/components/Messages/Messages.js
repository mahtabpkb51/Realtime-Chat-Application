import React, {
  useState,
  useEffect,
  useRef,
  useMemo
} from "react";

import ScrollToBottom from "react-scroll-to-bottom";

import Message from "./Message/Message";

import "./Messages.css";

// ===================== MESSAGES LIST =====================

const Messages = ({
  messages,
  name,
  onReaction,
  onReply,
  onDelete,
  onEdit,
  onPin
}) => {

  // ===================== SEARCH STATE =====================

  const [searchText, setSearchText] =
    useState("");

  const [currentResult, setCurrentResult] =
    useState(0);

  // ===================== PINNED STATE =====================

  const [showPinned, setShowPinned] =
    useState(false);

  const messageRefs = useRef({});

  // ===================== PINNED MESSAGES =====================

  const pinnedMessages = useMemo(
    () =>
      messages.filter(
        message =>
          message.pinned === true &&
          !message.deleted
      ),
    [messages]
  );

  // ===================== FILTER MESSAGES =====================

  const filteredMessages = useMemo(() => {

    const search = searchText.trim().toLowerCase();

    if (!search) {
      return messages;
    }

    return messages.filter(message => {

      if (
        message.type !== "text" ||
        !message.text
      ) {
        return false;
      }

      return message.text
        .toLowerCase()
        .includes(search);

    });

  }, [messages, searchText]);

  // ===================== RESET RESULT =====================

  useEffect(() => {
    setCurrentResult(0);
  }, [searchText]);

  // ===================== KEEP RESULT IN RANGE =====================

  useEffect(() => {

    if (
      filteredMessages.length === 0
    ) {
      setCurrentResult(0);
      return;
    }

    setCurrentResult(previous =>
      Math.min(
        previous,
        filteredMessages.length - 1
      )
    );

  }, [filteredMessages.length]);

  // ===================== SCROLL TO SEARCH RESULT =====================

  useEffect(() => {

    if (
      !searchText.trim() ||
      filteredMessages.length === 0
    ) {
      return;
    }

    const message =
      filteredMessages[currentResult];

    if (!message) {
      return;
    }

    const messageElement =
      messageRefs.current[message.id];

    if (messageElement) {

      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }

  }, [
    currentResult,
    searchText,
    filteredMessages
  ]);

  // ===================== SCROLL TO PINNED MESSAGE =====================

  const scrollToPinnedMessage = messageId => {

    const messageElement =
      messageRefs.current[messageId];

    if (!messageElement) {
      return;
    }

    setShowPinned(false);

    setTimeout(() => {

      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      messageElement.classList.add(
        "pinnedMessageHighlight"
      );

      setTimeout(() => {

        messageElement.classList.remove(
          "pinnedMessageHighlight"
        );

      }, 1500);

    }, 100);

  };

  // ===================== PREVIOUS SEARCH RESULT =====================

  const goToPreviousResult = () => {

    if (
      filteredMessages.length === 0
    ) {
      return;
    }

    setCurrentResult(
      previous =>
        previous === 0
          ? filteredMessages.length - 1
          : previous - 1
    );

  };

  // ===================== NEXT SEARCH RESULT =====================

  const goToNextResult = () => {

    if (
      filteredMessages.length === 0
    ) {
      return;
    }

    setCurrentResult(
      previous =>
        previous ===
        filteredMessages.length - 1
          ? 0
          : previous + 1
    );

  };

  // ===================== CLEAR SEARCH =====================

  const clearSearch = () => {

    setSearchText("");
    setCurrentResult(0);

  };

  // ===================== PINNED PREVIEW =====================

  const getPinnedPreview = message => {

    if (message.type === "file") {
      return `📎 ${message.fileName || "File"}`;
    }

    if (message.type === "audio") {
      return "🎤 Voice message";
    }

    if (message.text) {
      return message.text;
    }

    return "Message";

  };

  // ===================== RENDER =====================

  return (
    <div className="messagesContainer">

      {/* ===================== SEARCH BAR ===================== */}

      <div className="messageSearch">

        <span className="searchIcon">
          🔍
        </span>

        <input
          type="text"
          value={searchText}
          onChange={event =>
            setSearchText(
              event.target.value
            )
          }
          placeholder="Search messages..."
          className="messageSearchInput"
        />

        {searchText.trim() &&
          filteredMessages.length > 0 && (

            <div className="searchNavigation">

              <span className="searchPosition">
                {currentResult + 1}/
                {filteredMessages.length}
              </span>

              <button
                type="button"
                className="searchNavButton"
                onClick={
                  goToPreviousResult
                }
                title="Previous result"
              >
                ↑
              </button>

              <button
                type="button"
                className="searchNavButton"
                onClick={
                  goToNextResult
                }
                title="Next result"
              >
                ↓
              </button>

            </div>
          )}

        {searchText && (
          <button
            type="button"
            className="clearSearchButton"
            onClick={clearSearch}
            title="Clear search"
          >
            ✕
          </button>
        )}

      </div>

      {/* ===================== PINNED BUTTON ===================== */}

      <div className="pinnedHeader">

        <button
          type="button"
          className="pinnedToggleButton"
          onClick={() =>
            setShowPinned(
              previous => !previous
            )
          }
        >
          📌 Pinned

          <span className="pinnedCount">
            {pinnedMessages.length}
          </span>
        </button>

      </div>

      {/* ===================== PINNED PANEL ===================== */}

      {showPinned && (
        <div className="pinnedPanel">

          <div className="pinnedPanelHeader">

            <span>
              📌 Pinned Messages
            </span>

            <button
              type="button"
              className="closePinnedButton"
              onClick={() =>
                setShowPinned(false)
              }
            >
              ✕
            </button>

          </div>

          {pinnedMessages.length > 0 ? (

            <div className="pinnedList">

              {pinnedMessages.map(
                pinnedMessage => (

                  <button
                    type="button"
                    key={pinnedMessage.id}
                    className="pinnedItem"
                    onClick={() =>
                      scrollToPinnedMessage(
                        pinnedMessage.id
                      )
                    }
                  >

                    <div className="pinnedItemTop">

                      <strong>
                        {pinnedMessage.user}
                      </strong>

                      <span>
                        📌
                      </span>

                    </div>

                    <div className="pinnedItemText">
                      {getPinnedPreview(
                        pinnedMessage
                      )}
                    </div>

                    {pinnedMessage.pinnedBy && (
                      <div className="pinnedItemBy">
                        Pinned by{" "}
                        {pinnedMessage.pinnedBy}
                      </div>
                    )}

                  </button>

                )
              )}

            </div>

          ) : (

            <div className="emptyPinned">
              No pinned messages
            </div>

          )}

        </div>
      )}

      {/* ===================== SEARCH RESULT COUNT ===================== */}

      {searchText.trim() && (
        <div className="searchResultCount">

          {filteredMessages.length}{" "}

          {filteredMessages.length === 1
            ? "message"
            : "messages"}{" "}

          found

        </div>
      )}

      {/* ===================== MESSAGES ===================== */}

      <ScrollToBottom className="messages">

        {filteredMessages.length > 0 ? (

          filteredMessages.map(
            (message, i) => (

              <div
                key={
                  message.id || i
                }
                ref={element => {

                  if (message.id) {
                    messageRefs.current[
                      message.id
                    ] = element;
                  }

                }}
                className={
                  searchText.trim() &&
                  i === currentResult
                    ? "activeSearchResult"
                    : ""
                }
              >

                <Message
                  message={message}
                  name={name}
                  searchText={searchText}
                  onReaction={onReaction}
                  onReply={onReply}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPin={onPin}
                />

              </div>

            )
          )

        ) : (

          <div className="noSearchResults">
            No messages found
          </div>

        )}

      </ScrollToBottom>

    </div>
  );
};

export default Messages;