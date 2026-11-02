const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const Challenge = require("../src/models/Challenge");
const ChallengeRequest = require("../src/models/ChallengeRequest");
const Submission = require("../src/models/Submission");
const app = require("../app");
const {
  createChallenge,
  createChallengeRequest,
  createSubmission,
  createToken,
  createUser,
  useTestDatabase,
} = require("../api-test-helpers");

describe("challenge archival", () => {
  useTestDatabase();

  it("allows administrators to archive a challenge without submissions", async () => {
    const admin = await createUser({ role: "admin" });
    const challenge = await createChallenge();

    const response = await request(app)
      .delete(`/api/challenges/${challenge._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Challenge archived successfully.");
    assert.ok(response.body.data.archivedAt);
    assert.ok(await Challenge.exists({ _id: challenge._id }));

    const missingResponse = await request(app)
      .delete(`/api/challenges/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);
    assert.equal(missingResponse.status, 404);
  });

  it("archives a challenge without modifying existing submissions", async () => {
    const admin = await createUser({ role: "admin" });
    const user = await createUser();
    const challenge = await createChallenge();
    const submission = await createSubmission(user, challenge);

    const response = await request(app)
      .delete(`/api/challenges/${challenge._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);

    const savedSubmission = await Submission.findById(submission._id);
    assert.equal(response.status, 200);
    assert.ok(await Challenge.exists({ _id: challenge._id }));
    assert.equal(savedSubmission.challenge.toString(), challenge._id.toString());
    assert.equal(savedSubmission.repositoryUrl, submission.repositoryUrl);
  });

  it("requires authentication and administrator authorization to archive", async () => {
    const user = await createUser();
    const challenge = await createChallenge();

    const unauthenticated = await request(app).delete(
      `/api/challenges/${challenge._id}`,
    );
    const nonAdmin = await request(app)
      .delete(`/api/challenges/${challenge._id}`)
      .set("Authorization", `Bearer ${createToken(user)}`);

    assert.equal(unauthenticated.status, 401);
    assert.equal(nonAdmin.status, 403);
    assert.equal((await Challenge.findById(challenge._id)).archivedAt, null);
  });

  it("excludes archived challenges from active listings and retrieval", async () => {
    const admin = await createUser({ role: "admin" });
    const active = await createChallenge();
    const archived = await createChallenge({ title: "Archived challenge" });

    await request(app)
      .delete(`/api/challenges/${archived._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);
    const listing = await request(app).get("/api/challenges");
    const retrieval = await request(app).get(
      `/api/challenges/${archived._id}`,
    );

    assert.equal(listing.status, 200);
    assert.deepEqual(
      listing.body.data.map((item) => item._id),
      [active._id.toString()],
    );
    assert.equal(retrieval.status, 404);
  });

  it("rejects new submissions for archived challenges but accepts active ones", async () => {
    const user = await createUser();
    const admin = await createUser({ role: "admin" });
    const archived = await createChallenge();
    const active = await createChallenge({ title: "Another active challenge" });
    const token = createToken(user);

    await request(app)
      .delete(`/api/challenges/${archived._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);
    const archivedSubmission = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        challengeId: archived._id.toString(),
        repositoryUrl: "https://github.com/proofpulse/archived-solution",
        description: "A solution for an archived challenge.",
      });
    const activeSubmission = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        challengeId: active._id.toString(),
        repositoryUrl: "https://github.com/proofpulse/active-solution",
        description: "A solution for an active challenge.",
      });

    assert.equal(archivedSubmission.status, 400);
    assert.match(archivedSubmission.body.message, /archived/);
    assert.equal(activeSubmission.status, 201);
  });

  it("continues populating archived challenge details on historical submissions", async () => {
    const user = await createUser();
    const admin = await createUser({ role: "admin" });
    const challenge = await createChallenge();
    await createSubmission(user, challenge);

    await request(app)
      .delete(`/api/challenges/${challenge._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);
    const response = await request(app)
      .get("/api/submissions/mine")
      .set("Authorization", `Bearer ${createToken(user)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.count, 1);
    assert.deepEqual(response.body.data[0].challenge, {
      _id: challenge._id.toString(),
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
    });
  });

  it("preserves the original archivedAt timestamp on repeated requests", async () => {
    const admin = await createUser({ role: "admin" });
    const challenge = await createChallenge();
    const originalTimestamp = new Date("2024-06-07T08:09:10.000Z");
    await Challenge.findByIdAndUpdate(challenge._id, {
      $set: { archivedAt: originalTimestamp },
    });

    const response = await request(app)
      .delete(`/api/challenges/${challenge._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);
    const savedChallenge = await Challenge.findById(challenge._id);

    assert.equal(response.status, 200);
    assert.equal(savedChallenge.archivedAt.toISOString(), originalTimestamp.toISOString());
  });

  it("keeps legacy challenges without archivedAt active", async () => {
    const legacyId = new mongoose.Types.ObjectId();
    await Challenge.collection.insertOne({
      _id: legacyId,
      title: "Legacy challenge",
      description: "A legacy challenge without an archive timestamp.",
      category: "JavaScript",
      difficulty: "Easy",
      evaluationCriteria: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const listing = await request(app).get("/api/challenges");
    const retrieval = await request(app).get(`/api/challenges/${legacyId}`);

    assert.equal(listing.status, 200);
    assert.ok(listing.body.data.some((item) => item._id === legacyId.toString()));
    assert.equal(retrieval.status, 200);
  });

  it("reports active, archived, and genuinely missing published challenges", async () => {
    const admin = await createUser({ role: "admin" });
    const requester1 = await createUser();
    const requester2 = await createUser();
    const requester3 = await createUser();
    const activeRequest = await createChallengeRequest(requester1, {
      title: "Active published challenge",
      status: "Approved",
    });
    const archivedRequest = await createChallengeRequest(requester2, {
      title: "Archived published challenge",
      status: "Approved",
    });
    const missingRequest = await createChallengeRequest(requester3, {
      title: "Missing published challenge",
      status: "Approved",
      publishedChallenge: new mongoose.Types.ObjectId(),
    });
    const activeChallenge = await createChallenge({
      title: activeRequest.title,
      sourceRequest: activeRequest._id,
    });
    const archivedChallenge = await createChallenge({
      title: archivedRequest.title,
      sourceRequest: archivedRequest._id,
    });
    await Promise.all([
      ChallengeRequest.findByIdAndUpdate(activeRequest._id, {
        $set: { publishedChallenge: activeChallenge._id },
      }),
      ChallengeRequest.findByIdAndUpdate(archivedRequest._id, {
        $set: { publishedChallenge: archivedChallenge._id },
      }),
    ]);
    const archiveResponse = await request(app)
      .delete(`/api/challenges/${archivedChallenge._id}`)
      .set("Authorization", `Bearer ${createToken(admin)}`);

    const response = await request(app)
      .get("/api/challenge-requests?status=Approved")
      .set("Authorization", `Bearer ${createToken(admin)}`);
    const results = new Map(
      response.body.data.map((item) => [item._id, item]),
    );

    assert.equal(archiveResponse.status, 200);
    assert.equal(response.status, 200);
    assert.equal(results.get(activeRequest._id.toString()).challengeStatus, "active");
    assert.equal(
      results.get(archivedRequest._id.toString()).challengeStatus,
      "archived",
    );
    assert.equal(
      results.get(archivedRequest._id.toString()).publishedChallenge.toString(),
      archivedChallenge._id.toString(),
    );
    assert.equal(
      results.get(missingRequest._id.toString()).challengeStatus,
      "missing",
    );
    assert.equal(
      results.get(missingRequest._id.toString()).challengePublished,
      false,
    );
    assert.equal(results.get(archivedRequest._id.toString()).status, "Approved");
  });
});
