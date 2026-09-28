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
    "any.required": "MONGO_URI is mandatory to establish a database connection.",
  }),

  // Secrets & Tokens
//   ACCESS_TOKEN_SECRET: Joi.string().required().messages({
//     "any.required": "ACCESS_TOKEN_SECRET is required to sign access tokens.",
//   }),

//   REFRESH_TOKEN_SECRET: Joi.string().required().messages({
//     "any.required": "REFRESH_TOKEN_SECRET is required to sign refresh tokens.",
//   }),
//   ACCESS_TOKEN_EXPIRY: Joi.string().default("15m"),
//   REFRESH_TOKEN_EXPIRY: Joi.string().default("7d"),

  // CORS Options
  ALLOWED_ORIGINS: Joi.string().default("http://localhost:5173,http://localhost:3000"),
}).unknown(true); // Allow standard OS-level process variables (PATH, HOME, etc.)

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
});

module.exports = env;