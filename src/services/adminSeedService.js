const User = require("../models/userModel");
const { hashPassword } = require("../utils/password");
const env = require("../config/env");

const normalizeAdminConfig = ({ name, email, password } = {}) => {
  const resolvedName = (name || env.admin.name || "System Administrator").trim();
  const resolvedEmail = (email || env.admin.email || "admin@scanspend.local")
    .trim()
    .toLowerCase();
  const resolvedPassword = password || env.admin.password || "Admin@12345";

  return {
    name: resolvedName,
    email: resolvedEmail,
    password: resolvedPassword,
  };
};

const seedAdminUser = async (adminConfig = {}) => {
  const { name, email, password } = normalizeAdminConfig(adminConfig);

  if (!email || !password) {
    return {
      created: false,
      updated: false,
      skipped: true,
      reason: "admin credentials not configured",
    };
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const shouldPromote = existingUser.role !== "admin";

    if (shouldPromote) {
      await User.updateOne(
        { _id: existingUser._id },
        { $set: { role: "admin", isEmailVerified: true } },
      );
    }

    return {
      created: false,
      updated: shouldPromote,
      skipped: false,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: "admin",
      },
    };
  }

  const hashedPassword = await hashPassword(password);
  const createdUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isEmailVerified: true,
    isActive: true,
  });

  return {
    created: true,
    updated: false,
    skipped: false,
    user: {
      id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
    },
  };
};

module.exports = {
  seedAdminUser,
};
