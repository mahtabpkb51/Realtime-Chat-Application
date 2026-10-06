import React from "react";
import onlineIcon from "../../icons/onlineIcon.png";
import "./TextContainer.css";

// ===================== TEXT CONTAINER =====================

const TextContainer = ({
  users = [],
  userStatuses = {}
}) => (
  <div className="textContainer">

    {/* ===================== APP INFO ===================== */}

    <div className="appInfo">

      <div className="appIcon">
        💬
      </div>

      <h1>
        Realtime Chat
      </h1>

      <p className="appDescription">
        Connect, chat and stay in touch with people
        in real time.
      </p>

      <div className="featureList">

        <div className="feature">
          <span>⚡</span>
          <p>
            Instant messaging
          </p>
        </div>

        <div className="feature">
          <span>👥</span>
          <p>
            Multiple users
          </p>
        </div>

        <div className="feature">
          <span>🔒</span>
          <p>
            Private rooms
          </p>
        </div>

      </div>

    </div>

    {/* ===================== USERS ===================== */}

    <div className="usersSection">

      <div className="usersHeader">

        <div>

          <h2>
            People Online
          </h2>

          <p>
            Currently in this room
          </p>

        </div>

        <span className="userCount">
          {users.length}
        </span>

      </div>

      {/* ===================== USER LIST ===================== */}

      <div className="activeContainer">

        {users.length > 0 ? (

          users.map(
            ({ name, avatar, status }) => {

              const currentStatus =
                userStatuses[name] || status || "offline";

              const isOnline =
                currentStatus === "online";

              return (
                <div
                  key={name}
                  className="activeItem"
                >

                  {/* ===================== AVATAR ===================== */}

                  <div className="userAvatar">

                    {avatar || (
                      name.charAt(0).toUpperCase()
                    )}

                  </div>

                  {/* ===================== USER DETAILS ===================== */}

                  <div className="userDetails">

                    <span className="userName">
                      {name}
                    </span>

                    {/* ===================== USER STATUS ===================== */}

                    {isOnline ? (

                      <span className="onlineText">

                        <img
                          src={onlineIcon}
                          alt="Online"
                        />

                        Online

                      </span>

                    ) : (

                      <span className="offlineText">

                        <span className="offlineDot"></span>

                        Offline

                      </span>

                    )}

                  </div>

                </div>
              );
            }
          )

        ) : (

          <p className="noUsers">
            No users online
          </p>

        )}

      </div>

    </div>

  </div>
);

export default TextContainer;