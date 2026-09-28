const User = require("../models/userModel");
const createError = require("../utils/createError");
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Existing user 
    const userExist = await User.findOne({ email: normalizedEmail });

    if (userExist) throw createError(409, "Email is already registered");

    const hashedPassword = await hashPassword()

    res.status(201).json({
      success: true,
      message: "Successfully registered",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
};
