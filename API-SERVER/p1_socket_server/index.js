const net = require("net");
const http = require("http");
const socketIo = require("socket.io");

// Set up the WebSocket server on top of an HTTP server
const httpServer = http.createServer();
const io = socketIo(httpServer, {
  cors: {
    origin: "*", // Allow all origins, configure this as needed
    methods: ["GET", "POST"],
  },
  allowEIO3: true
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("WebSocket client connected:", socket.id);

  // Join a room based on data from the client
  socket.on("joinRoom", (room) => {
    socket.join(room);
    io.to(room).emit("joinRoom", room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("WebSocket client disconnected:", socket.id);
  });
});

const connectedSockets = new Set();

// Set up the TCP server
const tcpServer = net.createServer((socket) => {
  console.log("TCP Client connected");
  connectedSockets.add(socket);

  // Handle incoming data from the TCP client
  socket.on("data", (data) => {
    const receivedData = data.toString();
    console.log("Received data from TCP client:", receivedData);

    // Forward TCP data to a specific WebSocket room
    // For demonstration, we assume the room name is 'room1'
    // Adjust this as needed based on your app logic
    const roomName = 'room1';
    io.sockets.in(roomName).emit('data', data.toString());
    io.to(roomName).emit("p1data", receivedData);

    // Broadcast to other TCP clients except the sender
    connectedSockets.broadcast(receivedData, socket);

    // Send a response back to the TCP client
    socket.write("Hello from Node.js TCP server!");
  });

  socket.on("end", () => {
    console.log("TCP Client disconnected");
    connectedSockets.delete(socket);
  });
});

// Broadcast function for TCP clients
connectedSockets.broadcast = function (data, except) {
  for (let socket of this) {
    if (socket !== except) {
      try {
        console.log("Broadcasting to other TCP clients:", data);
        socket.write(data);
      } catch (error) {
        console.log("Error broadcasting to TCP clients:", error);
      }
    }
  }
};

// Start the TCP server on port 7000
tcpServer.listen(7000, () => {
  console.log("TCP server listening on port 7000");
});

// Start the WebSocket server on port 7001
httpServer.listen(7001, () => {
  console.log("WebSocket server listening on port 7001");
});
