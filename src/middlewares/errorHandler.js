const { errorResponse } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  const isExpiredAccessToken = err.name === "TokenExpiredError";
  const isInvalidAccessToken = ["JsonWebTokenError", "NotBeforeError"].includes(err.name);
  const tokenError = isExpiredAccessToken || isInvalidAccessToken;
  const statusCode = tokenError ? 401 : err.statusCode || 500;
  const code = isExpiredAccessToken
    ? "ACCESS_TOKEN_EXPIRED"
    : isInvalidAccessToken
      ? "INVALID_ACCESS_TOKEN"
      : null;
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment && statusCode >= 500) {
    console.error("API error:", err.stack || err);
  } else if (statusCode >= 500) {
    console.error("API error", {
      statusCode,
      method: req.method,
      route: req.route?.path || "unmatched",
      name: err.name || "Error",
    });
  }
  const message = isExpiredAccessToken
    ? "Your access token has expired."
    : isInvalidAccessToken
      ? "Invalid access token."
      : statusCode >= 500 && !isDevelopment
        ? "Internal Server Error. Please try again later."
        : err.message || "Internal Server Error. Please try again later.";

  return errorResponse(
    res,
    statusCode,
    message,
    statusCode < 500 ? err.details : null,
    code,
  );
};

module.exports = errorHandler;
