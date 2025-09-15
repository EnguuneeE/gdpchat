const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Track online users
let onlineUsers = [];

/** Word filter → replaces banned words with hashes */
function censorText(text) {
  const banned = ["nigga", "nigger", "retard", "rape"];
  let clean = text;
  banned.forEach((bad) => {
    const regex = new RegExp(bad, "gi");
    clean = clean.replace(regex, (match) => "#".repeat(match.length));
  });
  return clean;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user joins
  socket.on("userJoined", (user) => {
    const safeUser = {
      ...user,
      name: censorText(user.name),
      socketId: socket.id,
    };

    onlineUsers.push(safeUser);

    io.emit("updateUsers", onlineUsers);

    io.emit("chatMessage", {
      name: "System",
      text: `${safeUser.name} has joined the chat!`,
      color: "#FFD700",
      id: "system",
    });
  });

  // When a user sends a message
  socket.on("chatMessage", (msg) => {
    const safeMsg = { ...msg, text: censorText(msg.text), name: censorText(msg.name) };
    io.emit("chatMessage", safeMsg);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

      io.emit("updateUsers", onlineUsers);

      io.emit("chatMessage", {
        name: "System",
        text: `${user.name} has left the chat.`,
        color: "#FFD700",
        id: "system",
      });
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
