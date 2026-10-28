const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const User = require("../models/User");

async function getPublicProfile(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid developer profile ID.",
      });
    }

    const user = await User.findOne({
      _id: req.params.userId,
      role: "user",
    }).select("name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Developer profile not found.",
      });
    }

    const acceptedSubmissions = await Submission.find({
      user: user._id,
      status: "Accepted",
    })
      .select("repositoryUrl description submittedAt reviewedAt challenge")
      .populate("challenge", "title category difficulty")
      .sort({ reviewedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: user._id,
          name: user.name,
        },
        submissions: acceptedSubmissions.map((submission) => ({
          _id: submission._id,
          repositoryUrl: submission.repositoryUrl,
          description: submission.description,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
          challenge: submission.challenge,
        })),
      },
    });
  } catch (error) {
    console.error("Get public developer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve this developer profile.",
    });
  }
}

module.exports = { getPublicProfile };
