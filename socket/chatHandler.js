const Message = require("../models/Message");

module.exports = function chatHandler(io, socket, onlineUsers) {
  const userId = socket.handshake.query.userId;

  // Send a message
  socket.on("sendMessage", async ({ recipientId, text }) => {
    if (!recipientId || !text) return;

    try {
      const message = await Message.create({
        sender: userId,
        recipient: recipientId,
        text,
      });

      const formatted = {
        id: message._id.toString(),
        senderId: userId,
        text: message.text,
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

  // Typing indicators
  socket.on("typing", ({ recipientId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ recipientId }) => {
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
