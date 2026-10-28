const mongoose = require("mongoose");

const challengeRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: [true, "Challenge category is required"],
      enum: ["JavaScript", "React", "Node.js", "MongoDB", "C++"],
    },

    difficulty: {
      type: String,
      required: [true, "Challenge difficulty is required"],
      enum: ["Easy", "Medium", "Hard"],
    },

    reason: {
      type: String,
      required: [true, "Please explain why this challenge should be added"],
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    publicationPending: {
      type: Boolean,
      default: false,
    },

    publishedChallenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent the same user from submitting identical challenge titles.
challengeRequestSchema.index({ requestedBy: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("ChallengeRequest", challengeRequestSchema);
