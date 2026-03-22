const express = require("express");
const { getNotifications, markAllRead } = require("../controllers/notificationController");
const protect = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", protect, asyncHandler(getNotifications));
router.put("/read", protect, asyncHandler(markAllRead));

module.exports = router;
