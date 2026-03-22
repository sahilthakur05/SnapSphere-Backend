const express = require("express");
const {
  getMe,
  updateMe,
  searchUsers,
  getSuggestions,
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Static routes first (before :username param)
router.get("/me", protect, asyncHandler(getMe));
router.put("/me", protect, upload.single("avatar"), asyncHandler(updateMe));
router.get("/search", protect, asyncHandler(searchUsers));
router.get("/suggestions", protect, asyncHandler(getSuggestions));

// Dynamic routes
router.get("/:username", protect, asyncHandler(getUserProfile));
router.put("/:userId/follow", protect, asyncHandler(toggleFollow));
router.get("/:username/followers", protect, asyncHandler(getFollowers));
router.get("/:username/following", protect, asyncHandler(getFollowing));

module.exports = router;
