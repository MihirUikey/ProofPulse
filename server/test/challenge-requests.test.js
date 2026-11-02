const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const Challenge = require("../src/models/Challenge");
const app = require("../app");
const {
  createChallengeRequest,
  createToken,
  createUser,
  useTestDatabase,
} = require("../api-test-helpers");

describe("challenge request workflow", () => {
  useTestDatabase();

  it("creates a valid challenge request for the authenticated developer", async () => {
    const user = await createUser();
    const response = await request(app)
      .post("/api/challenge-requests")
      .set("Authorization", `Bearer ${createToken(user)}`)
      .send({
        title: "Create a reusable modal",
        description: "Build and document a reusable modal component.",
        category: "React",
        difficulty: "Hard",
        reason: "This is a common task for frontend developers.",
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.title, "Create a reusable modal");
    assert.equal(response.body.data.requestedBy, user._id.toString());
    assert.equal(response.body.data.status, "Pending");
  });

  it("rejects missing required fields", async () => {
    const user = await createUser();
    const response = await request(app)
      .post("/api/challenge-requests")
      .set("Authorization", `Bearer ${createToken(user)}`)
      .send({ title: "Incomplete request" });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      success: false,
      message: "All fields are required.",
    });
  });

  it("rejects invalid category and difficulty values", async () => {
    const user = await createUser();
    const token = createToken(user);
    const validRequest = {
      title: "Create a reusable modal",
      description: "Build and document a reusable modal component.",
      category: "React",
      difficulty: "Hard",
      reason: "This is a common task for frontend developers.",
    };

    for (const invalidField of [
      { category: "Rust" },
      { difficulty: "Expert" },
    ]) {
      const response = await request(app)
        .post("/api/challenge-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validRequest, ...invalidField });

      assert.equal(response.status, 400);
      assert.equal(response.body.success, false);
      assert.match(response.body.message, /is not a valid enum value/);
    }
  });

  it("returns a conflict for a duplicate request title from the same user", async () => {
    const user = await createUser();
    await createChallengeRequest(user);

    const response = await request(app)
      .post("/api/challenge-requests")
      .set("Authorization", `Bearer ${createToken(user)}`)
      .send({
        title: "Build a useful test challenge",
        description: "Create a solution that demonstrates this challenge well.",
        category: "JavaScript",
        difficulty: "Medium",
        reason: "This would be useful for the developer community.",
      });

    assert.equal(response.status, 409);
    assert.deepEqual(response.body, {
      success: false,
      message: "You have already requested a challenge with this title.",
    });
  });

  it("allows administrators to list requests and rejects non-admin review access", async () => {
    const user = await createUser();
    const admin = await createUser({ role: "admin" });
    await createChallengeRequest(user);

    const nonAdminReview = await request(app)
      .patch("/api/challenge-requests/507f1f77bcf86cd799439011/approve")
      .set("Authorization", `Bearer ${createToken(user)}`);
    const adminList = await request(app)
      .get("/api/challenge-requests?status=Pending")
      .set("Authorization", `Bearer ${createToken(admin)}`);

    assert.equal(nonAdminReview.status, 403);
    assert.equal(adminList.status, 200);
    assert.equal(adminList.body.count, 1);
    assert.equal(adminList.body.data[0].status, "Pending");
  });

  it("approves a pending request and publishes exactly one challenge after retries", async () => {
    const admin = await createUser({ role: "admin" });
    const challengeRequest = await createChallengeRequest(await createUser());
    const token = createToken(admin);

    const [firstApproval, concurrentApproval] = await Promise.all(
      [1, 2].map(() =>
        request(app)
          .patch(`/api/challenge-requests/${challengeRequest._id}/approve`)
          .set("Authorization", `Bearer ${token}`)
          .send({ reviewNote: "Approved for publication." }),
      ),
    );
    const repeatedApproval = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewNote: "Approved for publication." });

    assert.equal(firstApproval.status, 200);
    assert.equal(firstApproval.body.data.request.status, "Approved");
    assert.equal(firstApproval.body.data.request.publicationPending, false);
    assert.equal(concurrentApproval.status, 200);
    assert.equal(repeatedApproval.status, 200);
    assert.equal(await Challenge.countDocuments({ sourceRequest: challengeRequest._id }), 1);
    assert.equal(
      repeatedApproval.body.data.challenge._id,
      firstApproval.body.data.challenge._id,
    );
  });

  it("rejects a pending request and prevents reviewing it again", async () => {
    const admin = await createUser({ role: "admin" });
    const challengeRequest = await createChallengeRequest(await createUser());
    const token = createToken(admin);

    const rejection = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewNote: "This request needs more detail." });
    const repeatedRejection = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewNote: "Another review attempt." });
    const approvalAfterRejection = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/approve`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(rejection.status, 200);
    assert.equal(rejection.body.data.status, "Rejected");
    assert.equal(repeatedRejection.status, 409);
    assert.equal(approvalAfterRejection.status, 409);
  });

  it("returns a validation error when rejection has no request body", async () => {
    const admin = await createUser({ role: "admin" });
    const challengeRequest = await createChallengeRequest(await createUser());
    const response = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/reject`)
      .set("Authorization", `Bearer ${createToken(admin)}`);

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      success: false,
      message: "Provide a rejection note of up to 1000 characters.",
    });
  });

  it("prevents rejecting an already-approved request", async () => {
    const admin = await createUser({ role: "admin" });
    const challengeRequest = await createChallengeRequest(await createUser());
    const token = createToken(admin);

    const approval = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    const rejection = await request(app)
      .patch(`/api/challenge-requests/${challengeRequest._id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewNote: "This should no longer be reviewable." });

    assert.equal(approval.status, 200);
    assert.equal(rejection.status, 409);
  });
});
