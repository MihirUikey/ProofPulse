const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const challengeRoutes = require("./src/routes/challengeRoutes");
const submissionRoutes = require("./src/routes/submissionRoutes");
const challengeRequestRoutes = require("./src/routes/challengeRequestRoutes");
const profileRoutes = require("./src/routes/profileRoutes");

const app = express();
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
  app.set("trust proxy", trustProxyHops);
}
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:8080"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);
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
