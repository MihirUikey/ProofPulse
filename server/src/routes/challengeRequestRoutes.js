const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createChallengeRequest,
  getChallengeRequests,
  approveChallengeRequest,
  rejectChallengeRequest,
} = require("../Controllers/challengeRequestController");

// Authenticated developers can submit requests
router.post("/", protect, createChallengeRequest);

// Administrators can list, approve, and reject requests
router.get("/", protect, adminOnly, getChallengeRequests);

router.patch("/:id/approve", protect, adminOnly, approveChallengeRequest);

router.patch("/:id/reject", protect, adminOnly, rejectChallengeRequest);

module.exports = router;
