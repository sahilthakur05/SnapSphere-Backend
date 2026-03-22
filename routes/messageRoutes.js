const express = require("express");
const { getConversations, getMessages, sendMessage } = require("../controllers/messageController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
