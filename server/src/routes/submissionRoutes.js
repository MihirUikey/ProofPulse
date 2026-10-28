const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createSubmission,
  getMySubmissions,
  getSubmissionsForReview,
  reviewSubmission,
} = require("../Controllers/submissionController");

// Submit a challenge (login required)
router.post("/", protect, createSubmission);

// Get submissions belonging to the logged-in user
router.get("/mine", protect, getMySubmissions);

// Administrators can review submissions
router.get("/admin", protect, adminOnly, getSubmissionsForReview);
router.patch("/admin/:id/review", protect, adminOnly, reviewSubmission);

module.exports = router;
