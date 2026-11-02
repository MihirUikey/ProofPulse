const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const {
  createChallenge,
  createSubmission,
  createUser,
  useTestDatabase,
} = require("../api-test-helpers");

describe("public developer profiles", () => {
  useTestDatabase();

  it("returns intended public profile and accepted submission details without private account data", async () => {
    const developer = await createUser({
      name: "Public Developer",
      email: "private-account@example.test",
      password: "private-password-hash",
    });
    const challenge = await createChallenge();
    const accepted = await createSubmission(developer, challenge, {
      status: "Accepted",
      feedback: "Private reviewer feedback.",
      reviewedBy: developer._id,
      reviewedAt: new Date("2025-01-02T03:04:05.000Z"),
    });
    await createSubmission(developer, challenge, {
      repositoryUrl: "https://github.com/proofpulse/not-public",
      status: "Rejected",
    });
    challenge.archivedAt = new Date("2025-01-03T03:04:05.000Z");
    await challenge.save();

    const response = await request(app).get(
      `/api/profiles/${developer._id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body.data.profile).sort(), [
      "id",
      "name",
    ]);
    assert.equal(response.body.data.profile.id, developer._id.toString());
    assert.equal(response.body.data.profile.name, developer.name);
    assert.equal(response.body.data.submissions.length, 1);
    assert.deepEqual(
      Object.keys(response.body.data.submissions[0]).sort(),
      [
        "_id",
        "challenge",
        "description",
        "repositoryUrl",
        "reviewedAt",
        "submittedAt",
      ],
    );
    assert.equal(
      response.body.data.submissions[0]._id,
      accepted._id.toString(),
    );
    assert.equal(
      response.body.data.submissions[0].repositoryUrl,
      accepted.repositoryUrl,
    );
    assert.deepEqual(response.body.data.submissions[0].challenge, {
      _id: challenge._id.toString(),
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
    });
    const serializedResponse = JSON.stringify(response.body);
    for (const privateValue of [
      "private-account@example.test",
      "private-password-hash",
      "Private reviewer feedback.",
      "password",
      "token",
      "email",
      "role",
    ]) {
      assert.equal(serializedResponse.includes(privateValue), false);
    }
  });

  it("does not expose administrator profiles as developer profiles", async () => {
    const admin = await createUser({ role: "admin" });
    const response = await request(app).get(`/api/profiles/${admin._id}`);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      success: false,
      message: "Developer profile not found.",
    });
  });
});
