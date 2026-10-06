import React from "react";
import { Link } from "react-router-dom";

import onlineIcon from "../../icons/onlineIcon.png";
import closeIcon from "../../icons/closeIcon.png";

import "./InfoBar.css";

// ===================== INFO BAR =====================

const InfoBar = ({ room, theme, setTheme }) => {

  // ===================== THEME TOGGLE =====================

  const toggleTheme = () => {
    setTheme(
      theme === "dark"
        ? "light"
        : "dark"
    );
  };

  return (
    <div className="infoBar">

      {/* ===================== LEFT SIDE ===================== */}

      <div className="leftInnerContainer">

        <span className="statusDot"></span>

        <div className="roomInfo">
          <h3>Realtime Chat</h3>
          <span>Room: {room}</span>
        </div>

      </div>

      {/* ===================== RIGHT SIDE ===================== */}

      <div className="rightInnerContainer">

        <div className="onlineStatus">
          <img
            className="onlineIcon"
            src={onlineIcon}
            alt="Online"
          />
          <span>Online</span>
        </div>

        <button
          className="themeButton"
          type="button"
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <Link to="/">
          <div className="closeButton">
            <img
              src={closeIcon}
              alt="Close"
            />
          </div>
        </Link>

      </div>

    </div>
  );
};

export default InfoBar;