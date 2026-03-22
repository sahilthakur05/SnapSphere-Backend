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

const router = express.Router();

// Static routes first
router.get("/feed", protect, getFeed);
router.get("/explore", protect, getExplorePosts);
router.get("/saved", protect, getSavedPosts);

// Create post (multipart)
router.post("/", protect, upload.single("image"), createPost);

// Single post
router.get("/:postId", protect, getPost);
router.put("/:postId", protect, updatePost);
router.delete("/:postId", protect, deletePost);

// Likes
router.put("/:postId/like", protect, toggleLike);
router.get("/:postId/likes", protect, getLikes);

// Comments
router.post("/:postId/comment", protect, addComment);
router.put("/:postId/comment/:commentId", protect, updateComment);
router.delete("/:postId/comment/:commentId", protect, deleteComment);

// Save / Report
router.put("/:postId/save", protect, toggleSave);
router.post("/:postId/report", protect, reportPost);

module.exports = router;
