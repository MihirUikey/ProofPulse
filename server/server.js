const mongoose = require("mongoose");
const Challenge = require("./src/models/Challenge");
require("dotenv").config();
const app = require("./app");

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
