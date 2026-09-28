const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require('cookie-parser')
const mongoSanitize = require("express-mongo-sanitize");
const express = require("express");
const env = require("../config/env");

const configureSecurityMiddleware = (app) => {
  // Trust Proxy (Required when hosted behind proxies like Render, AWS ALB, Nginx, Cloudflare)
  app.set("trust-proxy", env.trustProxy || 1);

  // Disable x-powered-by header (prevents leaking server framework details)
  app.disable("x-powered-by");

  // Helmet: Sets various HTTP security headers (XSS, CSP, HSTS, Sniffing prevention)
  app.use(helmet());

  // CORS: Restrict API access to trusted origins only
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman) in non-production
      if (!origin && env.nodeEnv !== "production") {
        return callback(null, true);
      }

      if (env.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS Policy Error: Origin not allowed"),
        false,
      );
    },
    credentials: true, // Allows HttpOnly cookies to be sent across origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  };

  app.use(cors(corsOptions));

  //   Request Size Limits: Mitigate Payload Denial of Service attacks
  app.use(express.json({ limit: "10kb" })); // Prevents large JSON payload floods
  app.use(express.urlencoded({ extended: true, limit: "1mb" })); // Limits URL-encoded form data

  // Cookie Parser: Securely parse incoming cookie headers (used for HttpOnly refresh tokens)
  app.use(cookieParser());

  //   Custom NoSQL Injection Sanitization (Sanitize Body, Query, Params)
  const sanitizeRequest = (req, res, next) => {
    ["body", "params", "query"].forEach((key) => {
      if (req[key]) mongoSanitize.sanitize(req[key]);
    });

    next();
  };

  app.use(sanitizeRequest);

  //   Rate Limiting: Prevent Brute-force & Denial of Service (DoS) attacks
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      status: 429,
      error:
        "Too many requests from this IP, please try again after 15 minutes.",
    },
  });

  // Apply rate limiter specifically to API endpoints
  app.use("/api", apiLimiter);
};

module.exports = configureSecurityMiddleware;
