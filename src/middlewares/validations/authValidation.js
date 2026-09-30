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
})

// Forgot Password

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email",
  }),
})

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
};
