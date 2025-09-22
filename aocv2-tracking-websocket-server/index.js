const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

let socketCount = 0;

// Middleware or routes (optional, if you need to add API routes or static files)
app.get("/", (req, res) => {
  res.send("Socket.IO server is running on port 5050");
});

// Socket.IO connection setup
io.on("connection", (socket) => {
  console.log(`Socket connected, ID: ${socket.id}`);
  socketCount++;
  console.log(`Current connected sockets: ${socketCount}`);

  // Emit initial connection message
  socket.emit("data", `Socket connected, ID: ${socket.id}`);

  // Join a room
  socket.on("room_join", (data) => {
    const room = data.replace(/['"]+/g, "");
    socket.join(room);
    io.to(room).emit("data", `User joined room: ${room}`);
    console.log(`Socket ID: ${socket.id} joined room: ${room}`);
  });

  // Leave a room
  socket.on("room_leave", (data) => {
    const room = data.replace(/['"]+/g, "");
    socket.leave(room);
    io.to(room).emit("data", `User left room: ${room}`);
    console.log(`Socket ID: ${socket.id} left room: ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    socketCount--;
    console.log(`Socket disconnected, ID: ${socket.id}`);
    console.log(`Current connected sockets: ${socketCount}`);
  });
});

// Start the server on port 5050
server.listen(5050, () => {
  console.log("Server and Socket.IO listening on port 5050");
});
