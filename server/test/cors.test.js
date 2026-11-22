const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

// Configure test origins before importing the Express app.
const originalCorsOrigins = process.env.CORS_ORIGINS;

process.env.CORS_ORIGINS = "http://localhost:5173,http://localhost:8080";

const app = require("../app");

// Restore the original environment variable.
if (originalCorsOrigins === undefined) {
  delete process.env.CORS_ORIGINS;
} else {
  process.env.CORS_ORIGINS = originalCorsOrigins;
}

describe("CORS configuration", () => {
  it("allows requests from configured frontend origins", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "http://localhost:5173");

    assert.equal(response.status, 200);

    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173",
    );
  });

  it("does not grant CORS access to unapproved origins", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "https://untrusted.example");

    assert.equal(response.status, 200);

    assert.equal(response.headers["access-control-allow-origin"], undefined);
  });
});
