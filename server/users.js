const users = [];

// ===================== ADD USER =====================

const addUser = ({ id, name, room, avatar }) => {

  if (
    typeof name !== "string" ||
    typeof room !== "string"
  ) {
    return {
      error: "Username and room are required."
    };
  }

  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // ===================== VALIDATION =====================

  if (!name || !room) {
    return {
      error: "Username and room are required."
    };
  }

  if (name.length < 2 || name.length > 20) {
    return {
      error: "Username must be between 2 and 20 characters."
    };
  }

  if (room.length < 2 || room.length > 20) {
    return {
      error: "Room name must be between 2 and 20 characters."
    };
  }

  // ===================== EXISTING USER =====================

  const existingUser = users.find(
    user =>
      user.room === room &&
      user.name === name
  );

  // ===================== RECONNECT USER =====================

  if (existingUser) {

    if (existingUser.status === "offline") {

      existingUser.id = id;
      existingUser.avatar =
        avatar ||
        existingUser.avatar ||
        "👨‍💻";

      existingUser.status = "online";

      return {
        user: existingUser
      };
    }

    return {
      error: "Username is taken."
    };
  }

  // ===================== NEW USER =====================

  const user = {
    id,
    name,
    room,
    avatar: avatar || "👨‍💻",
    status: "online"
  };

  users.push(user);

  return {
    user
  };
};

// ===================== REMOVE USER =====================

const removeUser = id => {

  const user = users.find(
    user => user.id === id
  );

  if (user) {

    user.status = "offline";
    user.id = null;

    return user;
  }
};

// ===================== GET USER =====================

const getUser = id =>
  users.find(
    user =>
      user.id === id &&
      user.status === "online"
  );

// ===================== GET ROOM USERS =====================

const getUsersInRoom = room =>
  users.filter(
    user => user.room === room
  );

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};