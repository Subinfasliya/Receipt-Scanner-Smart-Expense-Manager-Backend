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
  MONGO_URI: Joi.string().allow("").default(""),
  MONGODB_URI: Joi.string().allow("").default(""),

  // Secrets & Tokens
  ACCESS_TOKEN_SECRET: Joi.string().allow("").default(""),
  JWT_ACCESS_SECRET: Joi.string().allow("").default(""),

  REFRESH_TOKEN_SECRET: Joi.string().allow("").default(""),
  JWT_REFRESH_SECRET: Joi.string().allow("").default(""),
  ACCESS_TOKEN_EXPIRY: Joi.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: Joi.string().default("7d"),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().allow("").default(""),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().allow("").default(""),

  // CORS Options
  ALLOWED_ORIGINS: Joi.string().default(
    "http://localhost:5173,http://localhost:3000",
  ),

  // SMTP Settings
  SMTP_HOST: Joi.string().required().messages({
    "any.required": "SMTP_HOST is required for email delivery.",
  }),

  SMTP_PORT: Joi.number().port().default(587),

  SMTP_SECURE: Joi.boolean().default(true),

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
  CLOUDINARY_CLOUD_NAME: Joi.string().allow("").default(""),
  CLOUDINARY_API_KEY: Joi.string().allow("").default(""),
  CLOUDINARY_API_SECRET: Joi.string().allow("").default(""),
  RAZORPAY_KEY_ID: Joi.string().allow("").default(""),
  RAZORPAY_KEY_SECRET: Joi.string().allow("").default(""),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow("").default(""),
  PREMIUM_MONTHLY_AMOUNT_PAISE: Joi.number().integer().min(100).default(49900),
  PREMIUM_ANNUAL_AMOUNT_PAISE: Joi.number().integer().min(100).default(499000),
  AI_API_KEY: Joi.string().allow("").default(""),
  AI_API_URL: Joi.string().uri().allow("").default(""),
  AI_MODEL: Joi.string().allow("").default(""),
}).unknown(true); // Allow standard OS-level process variables (PATH, HOME, etc.)

envSchema.and("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");
envSchema.and("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET");
envSchema.and("AI_API_KEY", "AI_API_URL", "AI_MODEL");

// 2. Validate process.env against schema with abortEarly: false
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false, // Collect ALL errors, not just the first one
});

// 3. FAIL-FAST: If validation fails, log errors and exit process immediately
const configurationErrors = error ? error.details.map((detail) => detail.message) : [];
const mongoUri = envVars.MONGO_URI || envVars.MONGODB_URI;
const accessSecret = envVars.ACCESS_TOKEN_SECRET || envVars.JWT_ACCESS_SECRET;
const refreshSecret = envVars.REFRESH_TOKEN_SECRET || envVars.JWT_REFRESH_SECRET;
if (!mongoUri) configurationErrors.push("MONGO_URI (or MONGODB_URI) is required.");
if (!accessSecret) configurationErrors.push("ACCESS_TOKEN_SECRET (or JWT_ACCESS_SECRET) is required.");
if (!refreshSecret) configurationErrors.push("REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET) is required.");

const hasPartialProviderConfig = (keys) => {
  const configured = keys.filter((key) => Boolean(envVars[key])).length;
  return configured > 0 && configured < keys.length;
};
if (hasPartialProviderConfig(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"])) {
  configurationErrors.push("Set all Cloudinary variables or leave all three unset.");
}
if (hasPartialProviderConfig(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"])) {
  configurationErrors.push("Set both Razorpay key variables or leave both unset.");
}
if (hasPartialProviderConfig(["AI_API_KEY", "AI_API_URL", "AI_MODEL"])) {
  configurationErrors.push("Set all AI provider variables or leave all three unset.");
}
if (envVars.NODE_ENV === "production") {
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    configurationErrors.push("Production token secrets must each contain at least 32 characters.");
  }
  if (envVars.ALLOWED_ORIGINS.split(",").some((origin) => /localhost|127\.0\.0\.1/i.test(origin))) {
    configurationErrors.push("Production ALLOWED_ORIGINS must not contain localhost.");
  }
  if (envVars.RAZORPAY_KEY_ID && !envVars.RAZORPAY_WEBHOOK_SECRET) {
    configurationErrors.push("RAZORPAY_WEBHOOK_SECRET is required when Razorpay is enabled.");
  }
}

if (configurationErrors.length) {
  console.error("\n=========================================");
  console.error("❌ FAIL-FAST: INVALID ENVIRONMENT CONFIG");
  console.error("=========================================");
  configurationErrors.forEach((message) => console.error(` -> ${message}`));
  console.error("=========================================\n");

  // Terminate node process with non-zero exit code (signals failure to host/docker)
  process.exit(1);
}

// 4. Export immutable, structured configuration object
const env = Object.freeze({
  port: envVars.PORT,
  nodeEnv: envVars.NODE_ENV,
  trustProxy: envVars.TRUST_PROXY,
  mongoUri,
  cors: {
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
  },
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiry: envVars.ACCESS_TOKEN_EXPIRES_IN || envVars.ACCESS_TOKEN_EXPIRY,
    refreshExpiry: envVars.REFRESH_TOKEN_EXPIRES_IN || envVars.REFRESH_TOKEN_EXPIRY,
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
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  razorpay: {
    keyId: envVars.RAZORPAY_KEY_ID,
    keySecret: envVars.RAZORPAY_KEY_SECRET,
    webhookSecret: envVars.RAZORPAY_WEBHOOK_SECRET,
    monthlyAmount: envVars.PREMIUM_MONTHLY_AMOUNT_PAISE,
    annualAmount: envVars.PREMIUM_ANNUAL_AMOUNT_PAISE,
  },
  ai: {
    apiKey: envVars.AI_API_KEY,
    endpoint: envVars.AI_API_URL,
    model: envVars.AI_MODEL,
  },
});

module.exports = env;
