const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const challengeRoutes = require("./src/routes/challengeRoutes");
const submissionRoutes = require("./src/routes/submissionRoutes");
const challengeRequestRoutes = require("./src/routes/challengeRequestRoutes");
const profileRoutes = require("./src/routes/profileRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/challenge-requests", challengeRequestRoutes);
app.use("/api/profiles", profileRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ProofPulse API!",
    status: "Running",
  });
});

app.use("/api/challenges", challengeRoutes);

module.exports = app;
