const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const sendResponse = require("../utils/ApiResponse");

const register = async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(
      createError(400, "User with this email or username already exists"),
    );
  }

  const user = await User.create({ username, email, password, fullName });
  const token = generateToken(res, user._id);

  sendResponse(
    res,
    201,
    {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.profilePicture || "",
      },
    },
    "User registered successfully",
  );
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(createError(400, "Please provide email and password"));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(createError(401, "Invalid email or password"));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(createError(401, "Invalid email or password"));
  }

  const token = generateToken(res, user._id);

  sendResponse(
    res,
    200,
    {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.profilePicture || "",
      },
    },
    "Login successful",
  );
};

const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  sendResponse(res, 200, null, "Logged out successfully");
};

// GET /auth/me — get current user
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.profilePicture,
  }, "User fetched successfully");
};

// POST /auth/refresh — refresh JWT using existing cookie
const refreshToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(createError(401, "No token to refresh"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError(401, "User not found"));
    }

    const newToken = generateToken(res, user._id);
    sendResponse(res, 200, { accessToken: newToken }, "Token refreshed successfully");
  } catch (error) {
    return next(createError(401, "Invalid token"));
  }
};

// PUT /auth/change-password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(createError(400, "Please provide current and new password"));
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(createError(401, "Current password is incorrect"));
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, 200, null, "Password changed successfully");
};

// POST /auth/forgot-password
const forgotPassword = async (req, res, next) => {
  const { email } = req.body || {};
  if (!email) {
    return next(createError(400, "Please provide email"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return sendResponse(res, 200, null, "If an account with that email exists, a reset link has been sent");
  }

  // In production, send email with reset token. For now, just acknowledge.
  sendResponse(res, 200, null, "If an account with that email exists, a reset link has been sent");
};

// DELETE /auth/account
const deleteAccount = async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    return next(createError(400, "Please provide your password to confirm"));
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(createError(401, "Password is incorrect"));
  }

  await User.findByIdAndDelete(req.user._id);

  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  sendResponse(res, 200, null, "Account deleted successfully");
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword,
  deleteAccount,
};
