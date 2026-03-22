const express = require("express");
const { getStories, createStory } = require("../controllers/storyController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/", protect, getStories);
router.post("/", protect, upload.single("image"), createStory);

module.exports = router;
