const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createSubmission,
  getMySubmissions,
} = require("../controllers/submissionController");

// Submit a challenge (login required)
router.post("/", protect, createSubmission);

// Get submissions belonging to the logged-in user
router.get("/mine", protect, getMySubmissions);

module.exports = router;
