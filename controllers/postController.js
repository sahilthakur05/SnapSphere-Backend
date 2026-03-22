const Post = require("../models/Post");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

// GET /posts/feed?page=1&limit=10
const getFeed = async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const following = [...req.user.following, req.user._id];

  const posts = await Post.find({ user: { $in: following } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .populate("user", "username fullName profilePicture")
    .lean();

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  // Fetch latest 3 comments per post in one query (avoids N+1)
  const postIds = posts.map((p) => p._id);
  const allComments = await Comment.find({ post: { $in: postIds } })
    .populate("user", "username fullName profilePicture")
    .sort({ createdAt: -1 }) // newest first so we can slice the latest 3
    .lean();

  const commentsByPost = {};
  for (const c of allComments) {
    const key = c.post.toString();
    if (!commentsByPost[key]) commentsByPost[key] = [];
    if (commentsByPost[key].length < 3) {
      commentsByPost[key].push({
        id: c._id,
        user: { id: c.user._id, username: c.user.username, avatar: c.user.profilePicture, fullName: c.user.fullName },
        text: c.text,
        createdAt: c.createdAt,
      });
    }
  }
  // Reverse to show oldest-first within the 3
  for (const key of Object.keys(commentsByPost)) {
    commentsByPost[key].reverse();
  }

  const formatted = posts.map((p) => ({
    id: p._id,
    user: { id: p.user._id, username: p.user.username, avatar: p.user.profilePicture, fullName: p.user.fullName },
    image: p.image,
    caption: p.caption,
    likes: p.likes,
    comments: commentsByPost[p._id.toString()] || [],
    createdAt: p.createdAt,
  }));

  sendResponse(res, 200, { posts: formatted, hasMore }, "Feed fetched successfully");
};

// GET /posts/explore
const getExplorePosts = async (req, res, next) => {
  const following = [...req.user.following, req.user._id];

  const posts = await Post.find({ user: { $nin: following } })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("image likes")
    .lean();

  const formatted = posts.map((p) => ({
    id: p._id,
    image: p.image,
    likes: p.likes,
  }));

  sendResponse(res, 200, formatted, "Explore posts fetched successfully");
};

// GET /posts/saved
const getSavedPosts = async (req, res, next) => {
  const savedEntries = await SavedPost.find({ user: req.user._id })
    .populate({
      path: "post",
      populate: { path: "user", select: "username fullName profilePicture" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const posts = savedEntries
    .filter((s) => s.post)
    .map((s) => ({
      id: s.post._id,
      user: { id: s.post.user._id, username: s.post.user.username, avatar: s.post.user.profilePicture, fullName: s.post.user.fullName },
      image: s.post.image,
      caption: s.post.caption,
      likes: s.post.likes,
      createdAt: s.post.createdAt,
    }));

  const savedPostIds = savedEntries.filter((s) => s.post).map((s) => s.post._id.toString());

  sendResponse(res, 200, { posts, savedPostIds }, "Saved posts fetched successfully");
};

// GET /posts/:postId
const getPost = async (req, res, next) => {
  const post = await Post.findById(req.params.postId)
    .populate("user", "username fullName profilePicture")
    .lean();

  if (!post) {
    return next(createError(404, "Post not found"));
  }

  const comments = await Comment.find({ post: post._id })
    .populate("user", "username fullName profilePicture")
    .sort({ createdAt: 1 })
    .lean();

  const formatted = {
    id: post._id,
    user: { id: post.user._id, username: post.user.username, avatar: post.user.profilePicture, fullName: post.user.fullName },
    image: post.image,
    caption: post.caption,
    likes: post.likes,
    comments: comments.map((c) => ({
      id: c._id,
      user: { id: c.user._id, username: c.user.username, avatar: c.user.profilePicture, fullName: c.user.fullName },
      text: c.text,
      createdAt: c.createdAt,
    })),
    createdAt: post.createdAt,
  };

  sendResponse(res, 200, formatted, "Post fetched successfully");
};

// POST /posts — create post (multipart: image + caption)
const createPost = async (req, res, next) => {
  if (!req.file) {
    return next(createError(400, "Please upload an image"));
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "snapsphere/posts" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  const post = await Post.create({
    user: req.user._id,
    image: result.secure_url,
    caption: req.body.caption || "",
  });

  const populated = await Post.findById(post._id).populate("user", "username fullName profilePicture").lean();

  const formatted = {
    id: populated._id,
    user: { id: populated.user._id, username: populated.user.username, avatar: populated.user.profilePicture, fullName: populated.user.fullName },
    image: populated.image,
    caption: populated.caption,
    likes: populated.likes,
    comments: [],
    createdAt: populated.createdAt,
  };

  sendResponse(res, 201, formatted, "Post created successfully");
};

// PUT /posts/:postId — edit caption
const updatePost = async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }
  if (post.user.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorized to edit this post"));
  }

  post.caption = req.body.caption ?? post.caption;
  await post.save();

  const populated = await Post.findById(post._id).populate("user", "username fullName profilePicture").lean();

  sendResponse(res, 200, {
    id: populated._id,
    user: { id: populated.user._id, username: populated.user.username, avatar: populated.user.profilePicture, fullName: populated.user.fullName },
    image: populated.image,
    caption: populated.caption,
    likes: populated.likes,
    createdAt: populated.createdAt,
  }, "Post updated successfully");
};

// DELETE /posts/:postId
const deletePost = async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }
  if (post.user.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorized to delete this post"));
  }

  await Comment.deleteMany({ post: post._id });
  await SavedPost.deleteMany({ post: post._id });
  await Notification.deleteMany({ post: post._id });
  await Report.deleteMany({ post: post._id });
  await Post.findByIdAndDelete(post._id);

  sendResponse(res, 200, { message: "Post deleted successfully" }, "Post deleted successfully");
};

// PUT /posts/:postId/like — toggle like (atomic to prevent race conditions)
const toggleLike = async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }

  const userId = req.user._id;
  const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

  let updated;
  if (alreadyLiked) {
    // Atomic remove — safe under concurrency
    updated = await Post.findByIdAndUpdate(
      post._id,
      { $pull: { likes: userId } },
      { new: true }
    );
    await Notification.deleteOne({ recipient: post.user, sender: userId, type: "like", post: post._id });
  } else {
    // Atomic add — $addToSet prevents duplicates even with concurrent requests
    updated = await Post.findByIdAndUpdate(
      post._id,
      { $addToSet: { likes: userId } },
      { new: true }
    );
    if (post.user.toString() !== userId.toString()) {
      await Notification.findOneAndUpdate(
        { recipient: post.user, sender: userId, type: "like", post: post._id },
        { recipient: post.user, sender: userId, type: "like", post: post._id, read: false },
        { upsert: true, new: true }
      );
    }
  }

  sendResponse(res, 200, { postId: updated._id, likes: updated.likes }, "Like toggled successfully");
};

// GET /posts/:postId/likes — users who liked
const getLikes = async (req, res, next) => {
  const post = await Post.findById(req.params.postId)
    .populate("likes", "username fullName profilePicture")
    .lean();

  if (!post) {
    return next(createError(404, "Post not found"));
  }

  const users = post.likes.map((u) => ({
    id: u._id,
    username: u.username,
    fullName: u.fullName,
    avatar: u.profilePicture,
  }));

  sendResponse(res, 200, users, "Likes fetched successfully");
};

// POST /posts/:postId/comment
const addComment = async (req, res, next) => {
  const { text } = req.body;
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return next(createError(400, "Comment text is required"));
  }
  if (trimmed.length > 500) {
    return next(createError(400, "Comment cannot exceed 500 characters"));
  }

  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }

  const comment = await Comment.create({
    post: post._id,
    user: req.user._id,
    text: trimmed,
  });

  // Send notification if not commenting on own post (upsert to prevent duplicates)
  if (post.user.toString() !== req.user._id.toString()) {
    await Notification.findOneAndUpdate(
      { recipient: post.user, sender: req.user._id, type: "comment", post: post._id },
      { recipient: post.user, sender: req.user._id, type: "comment", post: post._id, read: false },
      { upsert: true, new: true }
    );
  }

  const populated = await Comment.findById(comment._id).populate("user", "username fullName profilePicture").lean();

  sendResponse(res, 201, {
    postId: post._id,
    comment: {
      id: populated._id,
      user: { id: populated.user._id, username: populated.user.username, avatar: populated.user.profilePicture, fullName: populated.user.fullName },
      text: populated.text,
      createdAt: populated.createdAt,
    },
  }, "Comment added successfully");
};

// PUT /posts/:postId/comment/:commentId
const updateComment = async (req, res, next) => {
  const { text } = req.body;
  if (!text) {
    return next(createError(400, "Comment text is required"));
  }

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return next(createError(404, "Comment not found"));
  }
  if (comment.user.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorized to edit this comment"));
  }

  comment.text = text;
  await comment.save();

  sendResponse(res, 200, { text: comment.text }, "Comment updated successfully");
};

// DELETE /posts/:postId/comment/:commentId
const deleteComment = async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return next(createError(404, "Comment not found"));
  }
  if (comment.user.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorized to delete this comment"));
  }

  await Comment.findByIdAndDelete(comment._id);

  sendResponse(res, 200, { message: "Comment deleted successfully" }, "Comment deleted successfully");
};

// PUT /posts/:postId/save — toggle bookmark
const toggleSave = async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }

  const existing = await SavedPost.findOne({ user: req.user._id, post: post._id });

  if (existing) {
    await SavedPost.findByIdAndDelete(existing._id);
    sendResponse(res, 200, { postId: post._id, saved: false }, "Post unsaved");
  } else {
    await SavedPost.create({ user: req.user._id, post: post._id });
    sendResponse(res, 200, { postId: post._id, saved: true }, "Post saved");
  }
};

// POST /posts/:postId/report
const reportPost = async (req, res, next) => {
  const { reason } = req.body;
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (!trimmedReason) {
    return next(createError(400, "Report reason is required"));
  }
  if (trimmedReason.length > 500) {
    return next(createError(400, "Report reason cannot exceed 500 characters"));
  }

  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(createError(404, "Post not found"));
  }

  await Report.create({
    reporter: req.user._id,
    post: post._id,
    reason: trimmedReason,
  });

  sendResponse(res, 201, { message: "Post reported successfully" }, "Post reported successfully");
};

module.exports = {
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
};
