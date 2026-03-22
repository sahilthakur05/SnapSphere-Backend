const Message = require("../models/Message");
const User = require("../models/User");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");

// GET /messages — list all conversations (latest message per user)
const getConversations = async (req, res, next) => {
  const userId = req.user._id;

  const messages = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "username fullName profilePicture")
    .populate("recipient", "username fullName profilePicture")
    .populate("story", "image")
    .lean();

  // Group by conversation partner, keep only latest message
  const conversationMap = {};
  for (const msg of messages) {
    const partnerId =
      msg.sender._id.toString() === userId.toString()
        ? msg.recipient._id.toString()
        : msg.sender._id.toString();

    if (!conversationMap[partnerId]) {
      const partner =
        msg.sender._id.toString() === userId.toString()
          ? msg.recipient
          : msg.sender;

      const unreadCount = messages.filter(
        (m) =>
          m.sender._id.toString() === partnerId &&
          m.recipient._id.toString() === userId.toString() &&
          !m.read
      ).length;

      conversationMap[partnerId] = {
        user: {
          id: partner._id,
          username: partner.username,
          fullName: partner.fullName,
          avatar: partner.profilePicture,
        },
        lastMessage: {
          id: msg._id,
          text: msg.text,
          image: msg.image || null,
          senderId: msg.sender._id,
          storyImage: msg.story?.image || null,
          createdAt: msg.createdAt,
        },
        unreadCount,
      };
    }
  }

  sendResponse(res, 200, Object.values(conversationMap), "Conversations fetched");
};

// GET /messages/:userId — get messages with a specific user
const getMessages = async (req, res, next) => {
  const userId = req.user._id;
  const partnerId = req.params.userId;

  const partner = await User.findById(partnerId).select("username fullName profilePicture").lean();
  if (!partner) {
    return next(createError(404, "User not found"));
  }

  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: partnerId },
      { sender: partnerId, recipient: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("story", "image")
    .lean();

  // Mark unread messages as read
  await Message.updateMany(
    { sender: partnerId, recipient: userId, read: false },
    { read: true }
  );

  const formatted = messages.map((m) => ({
    id: m._id,
    senderId: m.sender.toString(),
    text: m.text,
    image: m.image || null,
    storyImage: m.story?.image || null,
    read: m.read,
    createdAt: m.createdAt,
  }));

  sendResponse(res, 200, {
    user: {
      id: partner._id,
      username: partner.username,
      fullName: partner.fullName,
      avatar: partner.profilePicture,
    },
    messages: formatted,
  }, "Messages fetched");
};

// POST /messages — send a direct message
const sendMessage = async (req, res, next) => {
  const { recipientId, text } = req.body || {};

  if (!recipientId || !text) {
    return next(createError(400, "Recipient and text are required"));
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(createError(404, "Recipient not found"));
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    text,
  });

  sendResponse(res, 201, {
    id: message._id,
    senderId: message.sender.toString(),
    text: message.text,
    read: message.read,
    createdAt: message.createdAt,
  }, "Message sent");
};

module.exports = { getConversations, getMessages, sendMessage };
