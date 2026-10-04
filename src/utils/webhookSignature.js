const crypto = require("node:crypto");

const signatureIsValid = (rawBody, signature, secret) => {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== "string" || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
};

module.exports = { signatureIsValid };