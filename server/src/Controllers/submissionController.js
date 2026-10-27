const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const Challenge = require("../models/Challenge");

// Create a submission
async function createSubmission(req, res) {
  try {
    const { challengeId, repositoryUrl, description } = req.body;

    if (!challengeId || !repositoryUrl || !description) {
      return res.status(400).json({
        success: false,
        message: "Challenge ID, repository URL, and description are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID.",
      });
    }

    const normalizedUrl = repositoryUrl.trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid GitHub repository URL.",
      });
    }

    const validGitHubUrl =
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.toLowerCase() === "github.com" &&
      parsedUrl.username === "" &&
      parsedUrl.password === "" &&
      /^\/[^/]+\/[^/]+\/?$/.test(parsedUrl.pathname);

    if (!validGitHubUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Repository URL must use the format https://github.com/owner/repository.",
      });
    }

    if (description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters.",
      });
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found.",
      });
    }

    const submission = await Submission.create({
      user: req.userId,
      challenge: challengeId,
      repositoryUrl: normalizedUrl,
      description: description.trim(),
    });

    const populatedSubmission = await Submission.findById(
      submission._id,
    ).populate("challenge", "title category difficulty");

    return res.status(201).json({
      success: true,
      message: "Challenge submitted successfully.",
      data: populatedSubmission,
    });
  } catch (error) {
    console.error("Create submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create submission.",
    });
  }
}

// Get submissions belonging to the logged-in user
async function getMySubmissions(req, res) {
  try {
    const submissions = await Submission.find({
      user: req.userId,
    })
      .populate("challenge", "title category difficulty")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve submissions.",
    });
  }
}

module.exports = {
  createSubmission,
  getMySubmissions,
};
