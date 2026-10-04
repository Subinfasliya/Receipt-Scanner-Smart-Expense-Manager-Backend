const { errorResponse } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
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
  const message = statusCode >= 500 && !isDevelopment
    ? "Internal Server Error. Please try again later."
    : err.message || "Internal Server Error. Please try again later.";

  return errorResponse(
    res,
    statusCode,
    message,
    statusCode < 500 ? err.details : null,
  );
};

module.exports = errorHandler;
