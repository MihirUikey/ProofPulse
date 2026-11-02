const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const {
  createChallenge,
  createSubmission,
  createToken,
  createUser,
  useTestDatabase,
} = require("../api-test-helpers");

describe("submission creation and review", () => {
  useTestDatabase();

  it("creates a submission with a populated challenge summary", async () => {
    const user = await createUser();
    const challenge = await createChallenge();
    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${createToken(user)}`)
      .send({
        challengeId: challenge._id.toString(),
        repositoryUrl: "https://github.com/proofpulse/solution",
        description: "A tested challenge solution.",
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user, user._id.toString());
    assert.equal(response.body.data.status, "Submitted");
    assert.deepEqual(response.body.data.challenge, {
      _id: challenge._id.toString(),
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
    });
  });

  it("rejects missing or invalid submission data", async () => {
    const user = await createUser();
    const challenge = await createChallenge();
    const token = createToken(user);
    const missingData = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    const emptyBody = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`);
    const invalidUrl = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        challengeId: challenge._id.toString(),
        repositoryUrl: "https://example.com/not-a-repository",
        description: "A submission.",
      });
    const invalidChallenge = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        challengeId: "not-an-id",
        repositoryUrl: "https://github.com/proofpulse/solution",
        description: "A submission.",
      });

    assert.equal(missingData.status, 400);
    assert.equal(emptyBody.status, 400);
    assert.equal(invalidUrl.status, 400);
    assert.equal(invalidChallenge.status, 400);
  });

  it("restricts administrator review routes to authenticated administrators", async () => {
    const user = await createUser();
    const challenge = await createChallenge();
    const submission = await createSubmission(user, challenge);
    const unauthenticated = await request(app).patch(
      `/api/submissions/admin/${submission._id}/review`,
    );
    const nonAdmin = await request(app)
      .patch(`/api/submissions/admin/${submission._id}/review`)
      .set("Authorization", `Bearer ${createToken(user)}`)
      .send({ status: "Accepted", feedback: "Looks good." });

    assert.equal(unauthenticated.status, 401);
    assert.equal(nonAdmin.status, 403);
  });

  it("allows administrators to review a submission with valid feedback", async () => {
    const user = await createUser();
    const admin = await createUser({ role: "admin" });
    const challenge = await createChallenge();
    const submission = await createSubmission(user, challenge);

    const response = await request(app)
      .patch(`/api/submissions/admin/${submission._id}/review`)
      .set("Authorization", `Bearer ${createToken(admin)}`)
      .send({ status: "Accepted", feedback: "Meets the evaluation criteria." });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "Accepted");
    assert.equal(response.body.data.feedback, "Meets the evaluation criteria.");
    assert.equal(response.body.data.reviewedBy._id, admin._id.toString());
    assert.ok(response.body.data.reviewedAt);
  });

  it("rejects invalid review statuses and missing feedback", async () => {
    const user = await createUser();
    const admin = await createUser({ role: "admin" });
    const challenge = await createChallenge();
    const submission = await createSubmission(user, challenge);
    const token = createToken(admin);
    const invalidStatuses = await Promise.all(
      ["Draft", "Submitted"].map((status) =>
        request(app)
          .patch(`/api/submissions/admin/${submission._id}/review`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status, feedback: "This is not a review status." }),
      ),
    );
    const missingFeedback = await request(app)
      .patch(`/api/submissions/admin/${submission._id}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Accepted", feedback: "  " });

    for (const invalidStatus of invalidStatuses) {
      assert.equal(invalidStatus.status, 400);
      assert.deepEqual(invalidStatus.body, {
        success: false,
        message: "Choose a valid review status.",
      });
    }
    assert.equal(missingFeedback.status, 400);
    assert.deepEqual(missingFeedback.body, {
      success: false,
      message: "Reviewer feedback is required.",
    });
  });

  it("returns only the authenticated user's submissions", async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const challenge = await createChallenge();
    const owned = await createSubmission(owner, challenge);
    await createSubmission(otherUser, challenge, {
      repositoryUrl: "https://github.com/proofpulse/other-solution",
    });

    const response = await request(app)
      .get("/api/submissions/mine")
      .set("Authorization", `Bearer ${createToken(owner)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.count, 1);
    assert.equal(response.body.data[0]._id, owned._id.toString());
    assert.equal(response.body.data[0].user, owner._id.toString());
  });
});
