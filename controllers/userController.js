const User = require("../models/User");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

const getMe = async (req, res) => {
  sendResponse(res, 200, req.user, "Profile fetched successfully");
};

// Update profile (fullName, bio, username)
const updateProfile = async (req, res, next) => {
  const { fullName, bio, username } = req.body;

  // If username is being changed, check if it's already taken
  if (username && username !== req.user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return next(createError(400, "Username is already taken"));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, bio, username },
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, updatedUser, "Profile updated successfully");
};

// Upload / update profile picture
const updateProfilePicture = async (req, res, next) => {
  if (!req.file) {
    return next(createError(400, "Please upload an image"));
  }

  // Upload to Cloudinary from buffer
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

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: result.secure_url },
    { new: true }
  );

  sendResponse(res, 200, updatedUser, "Profile picture updated successfully");
};

module.exports = { getMe, updateProfile, updateProfilePicture };