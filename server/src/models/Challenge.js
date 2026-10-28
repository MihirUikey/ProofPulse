const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["JavaScript", "React", "Node.js", "MongoDB", "C++"],
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    evaluationCriteria: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sourceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChallengeRequest",
      unique: true,
      sparse: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Challenge", challengeSchema);
