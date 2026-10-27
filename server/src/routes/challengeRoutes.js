const express = require("express");
const Challenge = require("../models/Challenge");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// CREATE a challenge
router.post("/", protect, async (req, res) => {
  try {
    const challenge = await Challenge.create({
      ...req.body,
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

// READ all challenges
router.get("/", async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch challenges",
    });
  }
});

// READ one challenge
router.get("/:id", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    res.status(200).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid challenge ID",
    });
  }
});
// UPDATE a challenge
router.put("/:id", protect, async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.userId,
      },
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
      const exists = await Challenge.exists({
        _id: req.params.id,
      });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not allowed to edit this challenge."
          : "Challenge not found.",
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

// DELETE a challenge — owner only
router.delete("/:id", protect, async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!challenge) {
      const exists = await Challenge.exists({
        _id: req.params.id,
      });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not allowed to delete this challenge."
          : "Challenge not found.",
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
