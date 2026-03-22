const express = require("express");
const { getStories, createStory, likeStory, replyToStory } = require("../controllers/storyController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(getStories));
router.post("/", protect, upload.single("image"), asyncHandler(createStory));
router.put("/:storyId/like", protect, asyncHandler(likeStory));
router.post("/:storyId/reply", protect, asyncHandler(replyToStory));

module.exports = router;
