const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

// Simple per-socket rate limiter
function createRateLimiter(maxEvents, windowMs) {
  const timestamps = [];
  return function isAllowed() {
    const now = Date.now();
    // Remove timestamps outside the window
    while (timestamps.length && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= maxEvents) return false;
    timestamps.push(now);
    return true;
  };
}

module.exports = function chatHandler(io, socket, onlineUsers) {
  const userId = socket.userId; // verified from JWT in socketManager middleware

  // Rate limiters per socket connection
  const messageLimiter = createRateLimiter(30, 60000);  // 30 messages per minute
  const imageLimiter = createRateLimiter(10, 60000);    // 10 images per minute
  const typingLimiter = createRateLimiter(60, 60000);   // 60 typing events per minute

  // Send a text message
  socket.on("sendMessage", async ({ recipientId, text }) => {
    if (!recipientId || !text) {
      return socket.emit("messageError", { error: "Recipient and text are required" });
    }
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed || trimmed.length > 1000) {
      return socket.emit("messageError", { error: "Message must be 1-1000 characters" });
    }
    if (!messageLimiter()) {
      return socket.emit("messageError", { error: "Too many messages, slow down" });
    }

    try {
      const message = await Message.create({
        sender: userId,
        recipient: recipientId,
        text: trimmed,
      });

      const formatted = {
        id: message._id.toString(),
        senderId: userId,
        text: message.text,
        image: null,
        storyImage: null,
        read: false,
        createdAt: message.createdAt,
      };

      // Confirm to sender
      socket.emit("messageSent", formatted);

      // Deliver to recipient if online
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", {
          ...formatted,
          fromUserId: userId,
        });
      }
    } catch (err) {
      console.error("sendMessage error:", err.message);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Send an image message
  socket.on("sendImage", async ({ recipientId, imageData, text }) => {
    if (!recipientId || !imageData) {
      return socket.emit("messageError", { error: "Recipient and image are required" });
    }
    if (!imageLimiter()) {
      return socket.emit("messageError", { error: "Too many images, slow down" });
    }
    // Validate base64 image size (~5MB when encoded)
    if (imageData.length > 7 * 1024 * 1024) {
      return socket.emit("messageError", { error: "Image is too large (max 5MB)" });
    }

    try {
      // Upload base64 image to Cloudinary
      const result = await cloudinary.uploader.upload(imageData, {
        folder: "snapsphere/chat",
        resource_type: "image",
      });

      const message = await Message.create({
        sender: userId,
        recipient: recipientId,
        text: text || "",
        image: result.secure_url,
      });

      const formatted = {
        id: message._id.toString(),
        senderId: userId,
        text: message.text,
        image: message.image,
        storyImage: null,
        read: false,
        createdAt: message.createdAt,
      };

      // Confirm to sender
      socket.emit("messageSent", formatted);

      // Deliver to recipient if online
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", {
          ...formatted,
          fromUserId: userId,
        });
      }
    } catch (err) {
      console.error("sendImage error:", err.message);
      socket.emit("messageError", { error: "Failed to send image" });
    }
  });

  // Typing indicators (rate-limited to prevent spam)
  socket.on("typing", ({ recipientId }) => {
    if (!recipientId || !typingLimiter()) return;
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ recipientId }) => {
    if (!recipientId) return;
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userStopTyping", { userId });
    }
  });

  // Mark messages as read
  socket.on("markRead", async ({ senderId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, recipient: userId, read: false },
        { read: true }
      );

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { readBy: userId });
      }
    } catch (err) {
      console.error("markRead error:", err.message);
    }
  });
};
