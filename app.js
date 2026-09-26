require('dotenv').config()
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const apiRouter = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// App Security and proxy settings
app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

// Security headers
app.use(helmet());

// Cors configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
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

// Health Check Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "success", message: "API Healthy..." });
});

// Public route
app.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

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

// Not found handler middleware

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
