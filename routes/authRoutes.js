const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword,
  deleteAccount,
} = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", protect, asyncHandler(getMe));
router.post("/refresh", asyncHandler(refreshToken));
router.put("/change-password", protect, asyncHandler(changePassword));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.delete("/account", protect, asyncHandler(deleteAccount));

module.exports = router;
