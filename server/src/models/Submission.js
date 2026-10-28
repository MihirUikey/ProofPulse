const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },

    repositoryUrl: {
      type: String,
      required: [true, "GitHub repository URL is required."],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Submission description is required."],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "In Review",
        "Changes Requested",
        "Accepted",
        "Rejected",
      ],
      default: "Submitted",
    },

    feedback: {
      type: String,
      default: "",
      maxlength: [3000, "Feedback cannot exceed 3000 characters."],
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

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Submission", submissionSchema);
