const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

const getMe = async (req, res) => {
  sendResponse(res, 200, req.user, "Profile fetched successfully");
};

// PUT /users/me — update profile (fullName, bio, avatar via FormData)
const updateMe = async (req, res, next) => {
  const { fullName, bio } = req.body;
  const updateData = {};

  if (fullName !== undefined) updateData.fullName = fullName;
  if (bio !== undefined) updateData.bio = bio;

  // If avatar file is uploaded
  if (req.file) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "snapsphere/profiles", transformation: [{ width: 400, height: 400, crop: "fill" }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    updateData.profilePicture = result.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, {
    user: {
      id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      avatar: updatedUser.profilePicture,
      bio: updatedUser.bio,
      followers: updatedUser.followers,
      following: updatedUser.following,
    },
  }, "Profile updated successfully");
};

// GET /users/search?q=query
const searchUsers = async (req, res, next) => {
  const q = req.query.q;
  if (!q) {
    return sendResponse(res, 200, [], "No search query");
  }

  // Escape special regex characters to prevent ReDoS attacks
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const users = await User.find({
    $or: [
      { username: { $regex: escaped, $options: "i" } },
      { fullName: { $regex: escaped, $options: "i" } },
    ],
  })
    .limit(20)
    .select("username fullName profilePicture")
    .lean();

  const formatted = users.map((u) => ({
    id: u._id,
    username: u.username,
    fullName: u.fullName,
    avatar: u.profilePicture,
  }));

  sendResponse(res, 200, formatted, "Search results");
};

// GET /users/suggestions — users you don't follow
const getSuggestions = async (req, res, next) => {
  const exclude = [...req.user.following, req.user._id];

  const users = await User.find({ _id: { $nin: exclude } })
    .limit(10)
    .select("username fullName profilePicture")
    .lean();

  const formatted = users.map((u) => ({
    id: u._id,
    username: u.username,
    fullName: u.fullName,
    avatar: u.profilePicture,
  }));

  sendResponse(res, 200, formatted, "Suggestions fetched successfully");
};

// GET /users/:username — user profile + posts
const getUserProfile = async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .select("username fullName profilePicture bio followers following")
    .lean();

  if (!user) {
    return next(createError(404, "User not found"));
  }

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .select("image likes createdAt")
    .lean();

  const profileUser = {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    avatar: user.profilePicture,
    bio: user.bio,
    followers: user.followers,
    following: user.following,
  };

  const profilePosts = posts.map((p) => ({
    id: p._id,
    image: p.image,
    likes: p.likes,
    createdAt: p.createdAt,
  }));

  sendResponse(res, 200, { user: profileUser, posts: profilePosts }, "Profile fetched successfully");
};

// PUT /users/:userId/follow — toggle follow/unfollow
const toggleFollow = async (req, res, next) => {
  const targetId = req.params.userId;

  if (targetId === req.user._id.toString()) {
    return next(createError(400, "You cannot follow yourself"));
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    return next(createError(404, "User not found"));
  }

  const isFollowing = req.user.following.some((id) => id.toString() === targetId);

  if (isFollowing) {
    // Unfollow — use bulkWrite to batch both updates together
    await User.bulkWrite([
      { updateOne: { filter: { _id: req.user._id }, update: { $pull: { following: targetId } } } },
      { updateOne: { filter: { _id: targetUser._id }, update: { $pull: { followers: req.user._id } } } },
    ]);
    const updated = await User.findById(targetId);
    sendResponse(res, 200, { message: "Unfollowed successfully", followers: updated.followers }, "Unfollowed successfully");
  } else {
    // Follow — use bulkWrite to batch both updates together
    await User.bulkWrite([
      { updateOne: { filter: { _id: req.user._id }, update: { $addToSet: { following: targetId } } } },
      { updateOne: { filter: { _id: targetUser._id }, update: { $addToSet: { followers: req.user._id } } } },
    ]);
    const updated = await User.findById(targetId);

    await Notification.findOneAndUpdate(
      { recipient: targetId, sender: req.user._id, type: "follow" },
      { recipient: targetId, sender: req.user._id, type: "follow", read: false },
      { upsert: true, new: true }
    );

    sendResponse(res, 200, { message: "Followed successfully", followers: updated.followers }, "Followed successfully");
  }
};

// GET /users/:username/followers
const getFollowers = async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .populate("followers", "username fullName profilePicture")
    .lean();

  if (!user) {
    return next(createError(404, "User not found"));
  }

  const users = user.followers.map((u) => ({
    id: u._id,
    username: u.username,
    fullName: u.fullName,
    avatar: u.profilePicture,
  }));

  sendResponse(res, 200, { users }, "Followers fetched successfully");
};

// GET /users/:username/following
const getFollowing = async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .populate("following", "username fullName profilePicture")
    .lean();

  if (!user) {
    return next(createError(404, "User not found"));
  }

  const users = user.following.map((u) => ({
    id: u._id,
    username: u.username,
    fullName: u.fullName,
    avatar: u.profilePicture,
  }));

  sendResponse(res, 200, { users }, "Following fetched successfully");
};

module.exports = {
  getMe,
  updateMe,
  searchUsers,
  getSuggestions,
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
};
