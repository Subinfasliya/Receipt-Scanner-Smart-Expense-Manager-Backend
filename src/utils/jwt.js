const jsonWebToken = require("jsonwebtoken");
const env = require("../config/env");

const createAccessToken = (payload) => {
  return jsonWebToken.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
    issuer: "scan-spend-api",
    audience: "scan-spend-client",
  });
};

const verifyAccessToken = (token) => {
  return jsonWebToken.verify(token, env.jwt.accessSecret, {
    issuer: "scan-spend-api",
    audience: "scan-spend-client",
  });
};

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
