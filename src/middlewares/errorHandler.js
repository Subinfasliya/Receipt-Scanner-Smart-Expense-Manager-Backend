const { errorResponse } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  console.error("Centralized Error Log:", err.stack || err);

  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";
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
