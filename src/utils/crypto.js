const crypto = require("crypto");

// Generate a cryptographically secure random token.

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

//  Create a SHA-256 hash of a token.

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Generate FamilyId
const generateRefreshTokenFamilyId = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate a cryptographically secure password reset token.
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash a password reset token before storing it in MongoDB.
const hashPasswordResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateRefreshToken,
  hashRefreshToken,
  generateRefreshTokenFamilyId,
  generatePasswordResetToken,
  hashPasswordResetToken,
};
