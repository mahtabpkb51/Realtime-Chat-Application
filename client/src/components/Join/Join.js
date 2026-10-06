import React, { useState } from "react";
import { Link } from "react-router-dom";

import "./Join.css";

// ===================== AVATAR OPTIONS =====================

const avatarOptions = [
  "👨‍💻",
  "👩‍💻",
  "🧑‍💻",
  "👨‍🎓",
  "👩‍🎓",
  "🧑‍🎓",
  "👨‍🚀",
  "👩‍🚀"
];

// ===================== JOIN COMPONENT =====================

const Join = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [avatar, setAvatar] = useState(
    avatarOptions[0]
  );

  // ===================== VALIDATION =====================

  const cleanName = name.trim();
  const cleanRoom = room.trim();

  // Name: letters, numbers and spaces only
  const nameRegex = /^[a-zA-Z0-9 ]+$/;

  // Room: letters, numbers, underscore and hyphen
  const roomRegex = /^[a-zA-Z0-9_-]+$/;

  const isNameValid =
    cleanName.length >= 2 &&
    cleanName.length <= 20 &&
    nameRegex.test(cleanName);

  const isRoomValid =
    cleanRoom.length >= 2 &&
    cleanRoom.length <= 20 &&
    roomRegex.test(cleanRoom);

  const isDisabled =
    !isNameValid || !isRoomValid;

  // ===================== JOIN =====================

  const handleJoin = event => {
    if (isDisabled) {
      event.preventDefault();
    }
  };

  return (
    <div className="joinOuterContainer">

      {/* ===================== BACKGROUND GLOW ===================== */}

      <div className="joinBackgroundGlow glowOne"></div>
      <div className="joinBackgroundGlow glowTwo"></div>

      {/* ===================== JOIN CARD ===================== */}

      <div className="joinInnerContainer">

        {/* ===================== LOGO ===================== */}

        <div className="joinLogo">
          💬
        </div>

        {/* ===================== HEADING ===================== */}

        <h1 className="heading">
          Realtime Chat
        </h1>

        <p className="joinSubtitle">
          Connect with people and start chatting instantly.
        </p>

        {/* ===================== PROFILE AVATAR ===================== */}

        <div className="avatarSection">

          <label className="avatarLabel">
            Choose Your Avatar
          </label>

          <div className="selectedAvatar">
            {avatar}
          </div>

          <div className="avatarOptions">

            {avatarOptions.map(option => (
              <button
                key={option}
                type="button"
                className={
                  `avatarOption ${avatar === option
                    ? "selected"
                    : ""
                  }`
                }
                onClick={() =>
                  setAvatar(option)
                }
              >
                {option}
              </button>
            ))}

          </div>

        </div>

        {/* ===================== NAME INPUT ===================== */}

        <div className="inputGroup">

          <label htmlFor="name">
            Your Name
          </label>

          <div className="joinInputWrapper">

            <span className="inputIcon">
              👤
            </span>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              className="joinInput"
              value={name}
              maxLength={20}
              onChange={event =>
                setName(event.target.value)
              }
              autoComplete="off"
            />

          </div>

        </div>

        {/* ===================== ROOM INPUT ===================== */}

        <div className="inputGroup roomGroup">

          <label htmlFor="room">
            Room Name
          </label>

          <div className="joinInputWrapper">

            <span className="inputIcon">
              🏠
            </span>

            <input
              id="room"
              type="text"
              placeholder="Enter room name"
              className="joinInput"
              value={room}
              maxLength={20}
              onChange={event =>
                setRoom(event.target.value)
              }
              autoComplete="off"
            />

          </div>

        </div>

        {/* ===================== JOIN BUTTON ===================== */}

        <Link
          className="joinLink"
          to={`/chat?name=${encodeURIComponent(
            cleanName
          )}&room=${encodeURIComponent(
            cleanRoom
          )}&avatar=${encodeURIComponent(
            avatar
          )}`}
          onClick={handleJoin}
        >

          <button
            className="button"
            type="button"
            disabled={isDisabled}
          >
            <span>
              Join Room
            </span>

            <span className="joinArrow">
              →
            </span>
          </button>

        </Link>

        {/* ===================== FOOTER ===================== */}

        <div className="joinFooter">

          <span>⚡</span>
          <span>Fast</span>

          <span className="footerDot">
            •
          </span>

          <span>🔒</span>
          <span>Private</span>

          <span className="footerDot">
            •
          </span>

          <span>💬</span>
          <span>Realtime</span>

        </div>

      </div>

    </div>
  );
};

export default Join;