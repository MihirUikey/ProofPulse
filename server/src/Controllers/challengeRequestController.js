const mongoose = require("mongoose");
const ChallengeRequest = require("../models/ChallengeRequest");
const Challenge = require("../models/Challenge");

async function createChallengeRequest(req, res) {
  try {
    const { title, description, category, difficulty, reason } = req.body;

    if (!title || !description || !category || !difficulty || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const challengeRequest = await ChallengeRequest.create({
      title,
      description,
      category,
      difficulty,
      reason,
      requestedBy: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Challenge request submitted successfully.",
      data: challengeRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already requested a challenge with this title.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create challenge request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to submit your request.",
    });
  }
}

// List challenge requests for administrators
async function getChallengeRequests(req, res) {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request status.",
        });
      }

      filter.status = status;
    }

    const requests = await ChallengeRequest.find(filter)
      .populate("requestedBy", "name username email")
      .populate("reviewedBy", "name username email")
      .sort({ createdAt: -1 });
    const challenges = await Challenge.find({
      sourceRequest: { $in: requests.map((request) => request._id) },
    }).select("_id sourceRequest");
    const challengeByRequest = new Map(
      challenges.map((challenge) => [
        String(challenge.sourceRequest),
        String(challenge._id),
      ]),
    );

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests.map((request) => ({
        ...request.toObject(),
        challengeId:
          challengeByRequest.get(String(request._id)) ||
          (request.publishedChallenge
            ? String(request.publishedChallenge)
            : null),
        challengePublished:
          challengeByRequest.has(String(request._id)) ||
          Boolean(request.publishedChallenge),
      })),
    });
  } catch (error) {
    console.error("Get challenge requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challenge requests.",
    });
  }
}

// Approve a request and publish it as a challenge
async function approveChallengeRequest(req, res) {
  let approvalRecorded = false;

  try {
    const { id } = req.params;
    const { reviewNote = "" } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge request ID.",
      });
    }

    if (typeof reviewNote !== "string" || reviewNote.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review note must be a string of at most 1000 characters.",
      });
    }

    let request = await ChallengeRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Challenge request not found.",
      });
    }

    if (request.status === "Pending") {
      request = await ChallengeRequest.findOneAndUpdate(
        { _id: id, status: "Pending" },
        {
          $set: {
            status: "Approved",
            reviewedBy: req.userId,
            reviewedAt: new Date(),
            reviewNote: reviewNote.trim(),
            publicationPending: true,
          },
        },
        { new: true, runValidators: true },
      );

      if (!request) {
        request = await ChallengeRequest.findById(id);
      }
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Challenge request not found.",
      });
    }

    if (request.status === "Rejected") {
      return res.status(409).json({
        success: false,
        message: "This request has already been rejected.",
      });
    }

    approvalRecorded =
      request.status === "Approved" && request.publicationPending;

    let challenge = await Challenge.findOne({ sourceRequest: id });
    if (
      !challenge &&
      request.status === "Approved" &&
      !request.publicationPending
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This request was already approved before linked publishing was enabled. Review the existing challenge before attempting another approval.",
      });
    }

    if (!challenge) {
      try {
        challenge = await Challenge.create({
          title: request.title,
          description: request.description,
          category: request.category,
          difficulty: request.difficulty,
          createdBy: request.reviewedBy || req.userId,
          sourceRequest: request._id,
        });
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }

        challenge = await Challenge.findOne({ sourceRequest: id });
        if (!challenge) {
          throw error;
        }
      }
    }

    request = await ChallengeRequest.findOneAndUpdate(
      { _id: id, status: "Approved" },
      {
        $set: {
          publicationPending: false,
          publishedChallenge: challenge._id,
        },
      },
      { new: true, runValidators: true },
    );
    approvalRecorded = false;

    return res.status(200).json({
      success: true,
      message: "Request approved and challenge published successfully.",
      data: { request, challenge },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Approve challenge request error:", error.message);

    return res.status(500).json({
      success: false,
      message: approvalRecorded
        ? "Approval was recorded, but the challenge could not be published. Retry approval to safely finish publishing."
        : "Failed to approve and publish this challenge request.",
    });
  }
}

// Reject a request
async function rejectChallengeRequest(req, res) {
  try {
    const { id } = req.params;
    const { reviewNote = "" } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge request ID.",
      });
    }

    if (
      typeof reviewNote !== "string" ||
      reviewNote.trim().length === 0 ||
      reviewNote.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a rejection note of up to 1000 characters.",
      });
    }

    const request = await ChallengeRequest.findOneAndUpdate(
      { _id: id, status: "Pending" },
      {
        $set: {
          status: "Rejected",
          reviewedBy: req.userId,
          reviewedAt: new Date(),
          reviewNote: reviewNote.trim(),
        },
      },
      { new: true, runValidators: true },
    )
      .populate("requestedBy", "name username email")
      .populate("reviewedBy", "name username email");

    if (!request) {
      const existingRequest = await ChallengeRequest.findById(id);

      if (!existingRequest) {
        return res.status(404).json({
          success: false,
          message: "Challenge request not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: `This request has already been ${existingRequest.status.toLowerCase()}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challenge request rejected.",
      data: request,
    });
  } catch (error) {
    console.error("Reject challenge request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to reject challenge request.",
    });
  }
}

module.exports = {
  createChallengeRequest,
  getChallengeRequests,
  approveChallengeRequest,
  rejectChallengeRequest,
};
