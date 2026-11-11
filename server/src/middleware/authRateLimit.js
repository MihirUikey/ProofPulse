const rateLimit = require("express-rate-limit");

function createAuthLimiters(options = {}) {
  const {
    loginWindowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) ||
      15 * 60 * 1000,
    loginMax = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    registerWindowMs = Number(process.env.REGISTER_RATE_LIMIT_WINDOW_MS) ||
      60 * 60 * 1000,
    registerMax = Number(process.env.REGISTER_RATE_LIMIT_MAX) || 5,
  } = options;

  const loginLimiter = rateLimit({
    windowMs: loginWindowMs,
    limit: loginMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many login attempts. Please try again later.",
    },
  });

  const registerLimiter = rateLimit({
    windowMs: registerWindowMs,
    limit: registerMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many registration attempts. Please try again later.",
    },
  });

  return { loginLimiter, registerLimiter };
}

const defaultLimiters = createAuthLimiters();

module.exports = {
  createAuthLimiters,
  ...defaultLimiters,
};
