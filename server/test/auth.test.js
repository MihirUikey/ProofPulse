const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const {
  createToken,
  createUser,
  useTestDatabase,
} = require("../api-test-helpers");

describe("authentication and administrator authorization", () => {
  useTestDatabase();

  it("rejects protected requests without a token", async () => {
    const response = await request(app).get("/api/auth/me");

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      success: false,
      message: "Authentication required. Please log in.",
    });
  });

  it("rejects invalid JWTs", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-valid-jwt");

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      success: false,
      message: "Invalid authentication token.",
    });
  });

  it("rejects expired JWTs", async () => {
    const user = await createUser();
    const token = createToken(user, { expiresIn: -1 });
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  });

  it("allows an authenticated user to retrieve their own account summary", async () => {
    const user = await createUser();
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${createToken(user)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: "user",
      },
    });
  });

  it("prevents authenticated non-admins from listing challenge requests", async () => {
    const user = await createUser();
    const response = await request(app)
      .get("/api/challenge-requests")
      .set("Authorization", `Bearer ${createToken(user)}`);

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, {
      success: false,
      message: "Admin access required.",
    });
  });

  it("allows administrators to access administrator-only routes", async () => {
    const admin = await createUser({ role: "admin" });
    const response = await request(app)
      .get("/api/challenge-requests")
      .set("Authorization", `Bearer ${createToken(admin)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      count: 0,
      data: [],
    });
  });
});
