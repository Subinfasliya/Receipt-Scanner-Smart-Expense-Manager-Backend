const env = require("../../config/env");
const createError = require("../../utils/createError");

const trustedOrigin = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && !env.cors.allowedOrigins.includes(origin)) {
    return next(createError(403, "Request origin is not allowed"));
  }
  return next();
};

module.exports = trustedOrigin;