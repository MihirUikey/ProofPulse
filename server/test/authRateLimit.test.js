const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { createAuthLimiters } = require("../src/middleware/authRateLimit");

describe("authentication rate limiting", () => {
  it("blocks login requests after the configured limit", async () => {
    const app = express();
    const { loginLimiter } = createAuthLimiters({
      loginWindowMs: 60 * 1000,
      loginMax: 2,
    });

    let controllerCalls = 0;

    app.post("/login", loginLimiter, (req, res) => {
      controllerCalls++;
      res.status(200).json({ success: true });
    });

    const first = await request(app).post("/login");
    const second = await request(app).post("/login");
    const third = await request(app).post("/login");

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);

    assert.equal(controllerCalls, 2);
    assert.equal(third.body.success, false);
    assert.equal(
      third.body.message,
      "Too many login attempts. Please try again later.",
    );
  });

  it("keeps registration limits independent from login limits", async () => {
    const app = express();

    const { loginLimiter, registerLimiter } = createAuthLimiters({
      loginWindowMs: 60 * 1000,
      loginMax: 1,
      registerWindowMs: 60 * 1000,
      registerMax: 1,
    });

    app.post("/login", loginLimiter, (req, res) => {
      res.json({ success: true });
    });

    app.post("/register", registerLimiter, (req, res) => {
      res.json({ success: true });
    });

    const loginFirst = await request(app).post("/login");
    const loginSecond = await request(app).post("/login");
    const registerFirst = await request(app).post("/register");
    const registerSecond = await request(app).post("/register");

    assert.equal(loginFirst.status, 200);
    assert.equal(loginSecond.status, 429);
    assert.equal(registerFirst.status, 200);
    assert.equal(registerSecond.status, 429);
  });
});
