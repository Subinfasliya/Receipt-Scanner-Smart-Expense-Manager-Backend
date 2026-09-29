const env = require("../config/env");

const isProduction = env.nodeEnv === "production";

const getRefreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
  path: "/",
};

const setRefreshCookie  = (res, refreshToken) => {
  res.cookie(
    "refreshToken",
    refreshToken,
    getRefreshTokenCookieOptions
  );
};

const clearRefreshCookie  = (res) => {
  res.clearCookie(
    "refreshToken",
    getRefreshTokenCookieOptions
  );
};

module.exports = {
  setRefreshCookie,
  clearRefreshCookie,

};