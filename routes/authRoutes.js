const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword,
  deleteAccount,
} = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/refresh", refreshToken);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.delete("/account", protect, deleteAccount);

module.exports = router;
