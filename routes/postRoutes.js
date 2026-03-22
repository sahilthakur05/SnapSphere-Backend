const express = require("express");
const {
  getFeed,
  getExplorePosts,
  getSavedPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getLikes,
  addComment,
  updateComment,
  deleteComment,
  toggleSave,
  reportPost,
} = require("../controllers/postController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Static routes first
router.get("/feed", protect, asyncHandler(getFeed));
router.get("/explore", protect, asyncHandler(getExplorePosts));
router.get("/saved", protect, asyncHandler(getSavedPosts));

// Create post (multipart)
router.post("/", protect, upload.single("image"), asyncHandler(createPost));

// Single post
router.get("/:postId", protect, asyncHandler(getPost));
router.put("/:postId", protect, asyncHandler(updatePost));
router.delete("/:postId", protect, asyncHandler(deletePost));

// Likes
router.put("/:postId/like", protect, asyncHandler(toggleLike));
router.get("/:postId/likes", protect, asyncHandler(getLikes));

// Comments
router.post("/:postId/comment", protect, asyncHandler(addComment));
router.put("/:postId/comment/:commentId", protect, asyncHandler(updateComment));
router.delete("/:postId/comment/:commentId", protect, asyncHandler(deleteComment));

// Save / Report
router.put("/:postId/save", protect, asyncHandler(toggleSave));
router.post("/:postId/report", protect, asyncHandler(reportPost));

module.exports = router;
