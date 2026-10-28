const express = require("express");
const { getPublicProfile } = require("../Controllers/profileController");

const router = express.Router();

router.get("/:userId", getPublicProfile);

module.exports = router;
