const Joi = require("joi");

//Register validation Schema
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must contain at least 3 characters. ",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid Email Address",
  }),
  password: Joi.string()
    .min(6)
    .max(30)
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
    .required()
    .messages({
      "string.pattern.base": "Password must contain only letters and numbers.",
    }),
  role: Joi.string().valid("user", "admin").default("user"),
});

//Login Validation Schema
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

// Forgot Password

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email",
  }),
});

// Reset Password
const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required().messages({
    "string.empty": "Reset token is required",
    "string.hex": "Invalid reset token",
    "string.length": "Invalid reset token",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "New password is required",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 128 characters",
  }),
});

// change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({ "string.empty": "Current password is required" }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    "string.empty": "New password is required",
    "string.min": "New password must be at least 8 characters",
    "string.max": "New password cannot exceed 128 characters",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
