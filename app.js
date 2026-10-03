const express = require("express");
const apiRouter = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");
const notFound = require("./src/middlewares/notFound");
const configureSecurityMiddleware = require("./src/middlewares/security");
const { successResponse } = require("./src/utils/apiResponse");

const app = express();

// Security Middleware
configureSecurityMiddleware(app);


// Public route
app.get("/", (req, res) =>
  successResponse(res, 200, "ScanSpend Smart Expense Tracking App API"),
);


// Main API Routes with Rate Limited
app.use("/api", apiRouter);

// Not found handler middleware
app.use(notFound);

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
