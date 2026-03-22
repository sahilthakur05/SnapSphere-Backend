const express = require("express");
const { getConversations, getMessages, sendMessage } = require("../controllers/messageController");
const protect = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(getConversations));
router.get("/:userId", protect, asyncHandler(getMessages));
router.post("/", protect, asyncHandler(sendMessage));

module.exports = router;
