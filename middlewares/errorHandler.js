const errorHandler = (err, req, res, next) => {
  console.error("Centralized Error Log:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error. Please try again later.";

  return res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

module.exports = errorHandler
