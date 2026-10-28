const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const challengeRoutes = require("./src/routes/challengeRoutes");
const Challenge = require("./src/models/Challenge");
const submissionRoutes = require("./src/routes/submissionRoutes");
const challengeRequestRoutes = require("./src/routes/challengeRequestRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/challenge-requests", challengeRequestRoutes);
app.use("/api/profiles", profileRoutes);
// Health-check route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ProofPulse API!",
    status: "Running",
  });
});

app.use("/api/challenges", challengeRoutes);

// Database connection and server startup
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Challenge.createIndexes();

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
