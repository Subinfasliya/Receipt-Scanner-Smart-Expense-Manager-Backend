// src/config/env.js
const Joi = require("joi");
require("dotenv").config();

// 1. Define strict schema for required & optional environment variables
const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  TRUST_PROXY: Joi.number().default(1),

  // Database
  MONGO_URI: Joi.string().required().messages({
    "any.required":
      "MONGO_URI is mandatory to establish a database connection.",
  }),

  // Secrets & Tokens
  ACCESS_TOKEN_SECRET: Joi.string().required().messages({
    "any.required": "ACCESS_TOKEN_SECRET is required to sign access tokens.",
  }),

  REFRESH_TOKEN_SECRET: Joi.string().required().messages({
    "any.required": "REFRESH_TOKEN_SECRET is required to sign refresh tokens.",
  }),
  ACCESS_TOKEN_EXPIRY: Joi.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: Joi.string().default("7d"),

  // CORS Options
  ALLOWED_ORIGINS: Joi.string().default(
    "http://localhost:5173,http://localhost:3000",
  ),

  // SMTP Settings
  SMPT_HOST: Joi.string().required().messages({
    "any.required": "SMTP_HOST is required for email delivery.",
  }),

  SMTP_PORT: Joi.number().port().default(587),

  SMPT_SECURE: Joi.boolean().default(true),

  SMTP_USER: Joi.string().required().messages({
    "any.required": "SMTP_USER is required for email authentication.",
  }),

  SMTP_PASSWORD: Joi.string().required().messages({
    "any.required": "SMTP_PASSWORD is required for email authentication.",
  }),

  EMAIL_FROM: Joi.string().email().required().messages({
    "string.email": "EMAIL_FROM must be a valid email address.",
    "any.required": "EMAIL_FROM is required to define the sender address.",
  }),

  CLIENT_URL: Joi.string().uri().default("http://localhost:5173"),
}).unknown(true); // Allow standard OS-level process variables (PATH, HOME, etc.)

// SMPT

// 2. Validate process.env against schema with abortEarly: false
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false, // Collect ALL errors, not just the first one
});

// 3. FAIL-FAST: If validation fails, log errors and exit process immediately
if (error) {
  console.error("\n=========================================");
  console.error("❌ FAIL-FAST: INVALID ENVIRONMENT CONFIG");
  console.error("=========================================");
  error.details.forEach((detail) => {
    console.error(` -> ${detail.message}`);
  });
  console.error("=========================================\n");

  // Terminate node process with non-zero exit code (signals failure to host/docker)
  process.exit(1);
}

// 4. Export immutable, structured configuration object
const env = Object.freeze({
  port: envVars.PORT,
  nodeEnv: envVars.NODE_ENV,
  trustProxy: envVars.TRUST_PROXY,
  mongoUri: envVars.MONGO_URI,
  cors: {
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
  },
  jwt: {
    accessSecret: envVars.ACCESS_TOKEN_SECRET,
    refreshSecret: envVars.REFRESH_TOKEN_SECRET,
    accessExpiry: envVars.ACCESS_TOKEN_EXPIRY,
    refreshExpiry: envVars.REFRESH_TOKEN_EXPIRY,
  },
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_SECURE,
    user: envVars.SMTP_USER,
    password: envVars.SMTP_PASSWORD,
    from: envVars.EMAIL_FROM,
  },
  clientUrl: envVars.CLIENT_URL,
});

module.exports = env;
