const express = require("express");
const { getStories, createStory, likeStory, replyToStory } = require("../controllers/storyController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/", protect, getStories);
router.post("/", protect, upload.single("image"), createStory);
router.put("/:storyId/like", protect, likeStory);
router.post("/:storyId/reply", protect, replyToStory);

module.exports = router;
