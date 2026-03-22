const Notification = require("../models/Notification");
const sendResponse = require("../utils/ApiResponse");

// GET /notifications
const getNotifications = async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username profilePicture")
    .populate("story", "image")
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatted = notifications.map((n) => ({
    id: n._id,
    type: n.type,
    sender: {
      id: n.sender._id,
      username: n.sender.username,
      avatar: n.sender.profilePicture,
    },
    postId: n.post || undefined,
    storyImage: n.story?.image || undefined,
    read: n.read,
    createdAt: n.createdAt,
  }));

  sendResponse(res, 200, { notifications: formatted, unreadCount }, "Notifications fetched successfully");
};

// PUT /notifications/read — mark all as read
const markAllRead = async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );

  sendResponse(res, 200, null, "All notifications marked as read");
};

module.exports = { getNotifications, markAllRead };
