const User = require("../models/userModel");
const { successResponse } = require("../utils/apiResponse");
const createError = require("../utils/createError");
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Existing user
    const userExist = await User.findOne({ email: normalizedEmail });

    if (userExist) throw createError(409, "Email is already registered");

    const user = {
      name,
      email,
      phone,
    }

    return successResponse(res, 201, "User registered successfully", user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
};
