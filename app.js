const env = require("./src/config/env")
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const apiRouter = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");
const notFound = require("./src/middlewares/notFound");

const app = express();

// App Security and proxy settings
app.disable("x-powered-by");
app.set("trust proxy", (env.trustProxy || 1));

// Security headers
app.use(helmet());

// Cors configuration
const corsOptions = {
  origin: env.cors.allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

app.use(cors(corsOptions));

// body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

//Custom Sanitize Middleware
const sanitizeRequest = (req, res, next) => {
  ["body", "params", "query"].forEach((key) => {
    if (req[key]) mongoSanitize.sanitize(req[key]);
  });

  next();
};

app.use(sanitizeRequest);

// Rate Limiter Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // time period 15 mint
  max: 100,
  message: {
    status: 429,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Main API Routes with Rate Limited
app.use("/api", apiLimiter, apiRouter);

// Database ready Check Route
app.get("/api/v1/ready", async (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    success: true,
    message: "API is healthy",
    environment: env.nodeEnv || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Health check up route
app.get("/api/v1/health", (req, res) =>
  res.json({
    success: true,
    message: "ScanSpend API is healthy",
    timestamp: new Date().toISOString(),
  }),
);

// Public route
app.get("/", (req, res) =>
  res.json({
    success: true,
    message: "ScanSpend Smart Expense Tracking App API",
  }),
);

// Not found handler middleware
app.use(notFound);

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
