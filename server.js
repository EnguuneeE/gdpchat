const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Keep track of online users
let onlineUsers = [];

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user joins with a nickname
  socket.on("userJoined", (user) => {
    // Save the user with their socket ID
    onlineUsers.push({ ...user, socketId: socket.id });

    // Send updated user list to all clients
    io.emit("updateUsers", onlineUsers);

    // Broadcast a system message
    io.emit("chatMessage", {
      name: "System",
      text: `${user.name} has joined the chat!`,
      color: "#FFD700",
      id: "system",
    });
  });

  // When a user sends a message
  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg); // broadcast to everyone
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

      // Update all clients with new online users list
      io.emit("updateUsers", onlineUsers);

      // Broadcast a system message
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
