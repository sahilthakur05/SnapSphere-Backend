const Message = require("../models/Message");
const User = require("../models/User");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");

// GET /messages — list all conversations (latest message per user)
const getConversations = async (req, res, next) => {
  const userId = req.user._id;
  const mongoose = require("mongoose");

  // Use aggregation to group by conversation partner and get the latest message
  const conversations = await Message.aggregate([
    // 1. Find all messages involving this user
    { $match: { $or: [{ sender: userId }, { recipient: mongoose.Types.ObjectId.createFromHexString(userId.toString()) }] } },
    // 2. Sort newest first
    { $sort: { createdAt: -1 } },
    // 3. Compute partnerId
    { $addFields: {
      partnerId: { $cond: { if: { $eq: ["$sender", userId] }, then: "$recipient", else: "$sender" } },
    }},
    // 4. Group by partner, keep latest message and count unread
    { $group: {
      _id: "$partnerId",
      lastMessage: { $first: "$$ROOT" },
      unreadCount: { $sum: {
        $cond: [{ $and: [{ $ne: ["$sender", userId] }, { $eq: ["$read", false] }] }, 1, 0],
      }},
    }},
    // 5. Sort by latest message time
    { $sort: { "lastMessage.createdAt": -1 } },
    // 6. Lookup partner user info
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "partnerInfo" } },
    { $unwind: "$partnerInfo" },
    // 7. Lookup story image if present
    { $lookup: { from: "stories", localField: "lastMessage.story", foreignField: "_id", as: "storyInfo" } },
  ]);

  const formatted = conversations.map((c) => ({
    user: {
      id: c.partnerInfo._id,
      username: c.partnerInfo.username,
      fullName: c.partnerInfo.fullName,
      avatar: c.partnerInfo.profilePicture,
    },
    lastMessage: {
      id: c.lastMessage._id,
      text: c.lastMessage.text,
      image: c.lastMessage.image || null,
      senderId: c.lastMessage.sender,
      storyImage: c.storyInfo?.[0]?.image || null,
      createdAt: c.lastMessage.createdAt,
    },
    unreadCount: c.unreadCount,
  }));

  sendResponse(res, 200, formatted, "Conversations fetched");
};

// GET /messages/:userId?page=1&limit=30 — get messages with a specific user
const getMessages = async (req, res, next) => {
  const userId = req.user._id;
  const partnerId = req.params.userId;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
  const skip = (page - 1) * limit;

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
    .sort({ createdAt: -1 }) // newest first for pagination
    .skip(skip)
    .limit(limit + 1)
    .populate("story", "image")
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  // Reverse to show oldest first in the page
  messages.reverse();

  // Mark unread messages as read (only on first page load)
  if (page === 1) {
    await Message.updateMany(
      { sender: partnerId, recipient: userId, read: false },
      { read: true }
    );
  }

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
    hasMore,
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
