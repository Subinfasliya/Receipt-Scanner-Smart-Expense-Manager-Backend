const User = require("../models/userModel");
const { successResponse } = require("../utils/apiResponse");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select(
        "_id name email role isEmailVerified isActive lastLoginAt createdAt",
      )
      .sort({ createdAt: -1 });
    return successResponse(res, 200, "Users retrieved successfully", { users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
};
