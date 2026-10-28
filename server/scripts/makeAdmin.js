require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL;

    if (!email) {
      throw new Error("ADMIN_EMAIL is missing from server/.env");
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { role: "admin" } },
      { new: true, runValidators: true },
    ).select("name email role");

    if (!user) {
      throw new Error(
        "Account not found. Register and log in with your account first.",
      );
    }

    console.log("Admin role assigned successfully:");
    console.log({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Failed to assign admin role:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
