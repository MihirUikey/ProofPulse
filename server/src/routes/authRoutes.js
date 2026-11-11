const express = require("express");
const { register, login, getMe } = require("../Controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/authRateLimit");
const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.get("/me", protect, getMe);
module.exports = router;
