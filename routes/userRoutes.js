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

const router = express.Router();

// Static routes first (before :username param)
router.get("/me", protect, getMe);
router.put("/me", protect, upload.single("avatar"), updateMe);
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestions);

// Dynamic routes
router.get("/:username", protect, getUserProfile);
router.put("/:userId/follow", protect, toggleFollow);
router.get("/:username/followers", protect, getFollowers);
router.get("/:username/following", protect, getFollowing);

module.exports = router;
