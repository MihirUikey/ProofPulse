const { execFileSync } = require("node:child_process");
const { after, before, beforeEach } = require("node:test");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Challenge = require("./src/models/Challenge");
const ChallengeRequest = require("./src/models/ChallengeRequest");
const Submission = require("./src/models/Submission");

const TEST_JWT_SECRET = "proofpulse-automated-tests-only";
const models = [User, Challenge, ChallengeRequest, Submission];

process.env.JWT_SECRET = TEST_JWT_SECRET;

function findSystemMongo() {
  try {
    const command = process.platform === "win32" ? "where" : "which";
    const systemBinary = execFileSync(command, ["mongod"], { encoding: "utf8" })
      .split(/\r?\n/)[0]
      .trim();
    const versionOutput = execFileSync(systemBinary, ["--version"], {
      encoding: "utf8",
    });
    const version = versionOutput.match(/db version v(\d+\.\d+\.\d+)/)?.[1];

    return version ? { systemBinary, version } : undefined;
  } catch {
    return undefined;
  }
}

function useTestDatabase() {
  let replicaSet;

  before(async () => {
    const systemMongo = findSystemMongo();
    replicaSet = await MongoMemoryReplSet.create({
      binary: systemMongo
        ? {
            systemBinary: systemMongo.systemBinary,
            version: systemMongo.version,
          }
        : undefined,
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });

    await mongoose.connect(replicaSet.getUri(), {
      dbName: `proofpulse-test-${process.pid}`,
    });
    await Promise.all(models.map((model) => model.init()));
  });

  beforeEach(async () => {
    await Promise.all(models.map((model) => model.deleteMany({})));
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (replicaSet) {
      await replicaSet.stop();
    }
  });
}

async function createUser(overrides = {}) {
  return User.create({
    name: "Test Developer",
    email: `developer-${new mongoose.Types.ObjectId()}@example.test`,
    password: "test-password-hash",
    ...overrides,
  });
}

function createToken(user, options) {
  return jwt.sign({ userId: user._id.toString() }, TEST_JWT_SECRET, options);
}

async function createChallenge(overrides = {}) {
  return Challenge.create({
    title: "Test challenge",
    description: "A challenge used by API tests.",
    category: "JavaScript",
    difficulty: "Easy",
    ...overrides,
  });
}

async function createChallengeRequest(requestedBy, overrides = {}) {
  return ChallengeRequest.create({
    title: "Build a useful test challenge",
    description: "Create a solution that demonstrates this challenge well.",
    category: "JavaScript",
    difficulty: "Medium",
    reason: "This would be useful for the developer community.",
    requestedBy: requestedBy._id,
    ...overrides,
  });
}

async function createSubmission(user, challenge, overrides = {}) {
  return Submission.create({
    user: user._id,
    challenge: challenge._id,
    repositoryUrl: "https://github.com/proofpulse/test-project",
    description: "A concise test submission.",
    ...overrides,
  });
}

module.exports = {
  createChallenge,
  createChallengeRequest,
  createSubmission,
  createToken,
  createUser,
  useTestDatabase,
};
