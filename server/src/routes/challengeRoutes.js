const express = require("express");
const Challenge = require("../models/Challenge");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE a challenge — admin only
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const challenge = await Challenge.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      difficulty: req.body.difficulty,
      evaluationCriteria: req.body.evaluationCriteria,
      createdBy: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Challenge created successfully.",
      data: challenge,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// READ all challenges — public
router.get("/", async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch challenges.",
    });
  }
});

// READ one challenge — public
router.get("/:id", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challenge.",
    });
  }
});

// UPDATE a challenge — admin only
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          difficulty: req.body.difficulty,
          evaluationCriteria: req.body.evaluationCriteria,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challenge updated successfully.",
      data: challenge,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE a challenge — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challenge deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete challenge.",
    });
  }
});

module.exports = router;
