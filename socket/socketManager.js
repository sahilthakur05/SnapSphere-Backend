const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatHandler = require("./chatHandler");

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    maxHttpBufferSize: 5e6, // 5MB for image uploads
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authenticate every socket connection using JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id; // attach verified userId to socket
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId; // from verified JWT, not from client query

    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    if (process.env.NODE_ENV !== "production") {
      console.log(`User connected: ${userId} (${socket.id})`);
    }

    // Register chat event handlers
    chatHandler(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      if (process.env.NODE_ENV !== "production") {
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getIO, getOnlineUsers };
