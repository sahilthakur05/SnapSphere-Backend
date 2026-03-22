const express = require("express");
const { getMe, updateProfile, updateProfilePicture } = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/profile-picture", protect, upload.single("profilePicture"), updateProfilePicture);

module.exports = router;