const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const challengeRoutes = require("./src/routes/challengeRoutes");
const { protect } = require("./src/middleware/authMiddleware");
const submissionRoutes = require("./src/routes/submissionRoutes");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
// Health-check route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ProofPulse API!",
    status: "Running",
  });
});

app.get("/api/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication verified successfully.",
    userId: req.userId,
  });
});

app.use("/api/challenges", challengeRoutes);

// Database connection and server startup
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`ProofPulse API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
