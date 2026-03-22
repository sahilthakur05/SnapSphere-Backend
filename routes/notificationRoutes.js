const express = require("express");
const { getNotifications, markAllRead } = require("../controllers/notificationController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAllRead);

module.exports = router;
