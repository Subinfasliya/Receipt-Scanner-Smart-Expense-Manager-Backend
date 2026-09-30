const User = require("../models/userModel");
const RefreshToken = require("../models/refreshToken");
const PasswordResetToken = require("../models/passwordResetToken");
const { hashPassword, comparePassword } = require("../utils/password");

const {
  generateRefreshToken,
  hashRefreshToken,
  generateRefreshTokenFamilyId,
  generatePasswordResetToken,
  hashPasswordResetToken,
} = require("../utils/crypto");

const { createAccessToken } = require("../utils/jwt");
const createError = require("../utils/createError");
const mongoose = require("mongoose");

// Constants
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRES_IN_MS = 15 * 60 * 1000; // 15mint

const registerUser = async ({
  name,
  email,
  password,
  userAgent,
  ipAddress,
}) => {
  /*
   * Email should already be normalized by Joi,
   * but normalize again at the service boundary.
   */
  const normalizedEmail = email.trim().toLowerCase();

  /*
   * Check existing account.
   */
  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw createError(409, "Email already registered");
  }

  /*
   * Hash password.
   */
  const hashedPassword = await hashPassword(password);

  /*
   * Create user.
   */
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  /*
   * Generate opaque refresh token.
   */
  const refreshToken = generateRefreshToken();

  /*
   * Only store the hash in MongoDB.
   */
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const familyId = generateRefreshTokenFamilyId();
  /*
   * Create refresh session.
   */
  const refreshSession = await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
    userAgent,
    ipAddress,
  });

  /*
   * Generate short-lived access token.
   */
  const accessToken = createAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  /*
   * Safe user object.
   */
  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
  };

  return {
    user: safeUser,
    accessToken,
    refreshToken,
    refreshSessionId: refreshSession._id,
  };
};

const loginUser = async ({ email, password, userAgent, ipAddress }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  //Check account status.
  if (!user.isActive) {
    throw createError(403, "Your account is inactive");
  }

  // Compare plain password with bcrypt hash
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw createError(401, "Invalid email or password");
  }

  // Update last login
  user.lastLoginAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  // Generate short-lived access token
  const accessToken = createAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  // Generate new Refresh token
  const refreshToken = generateRefreshToken();

  // Storing only the hash
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const familyId = generateRefreshTokenFamilyId();

  // Create new login session.
  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
    userAgent,
    ipAddress,
  });

  // safe user object
  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
  };

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

// Revoke Token Family function
const revokeTokenFamily = async (familyId, session) => {
  await RefreshToken.updateMany(
    {
      familyId,
      revokedAt: null, //Only revoke currently active * tokens.
    },
    { $set: { revokedAt: new Date() } },
    { session },
  );
};

// Refresh Access Token function
const refreshAccessToken = async ({
  refreshToken,
  userAgent = null,
  ipAddress = null,
}) => {
  /* * No cookie. */
  if (!refreshToken) {
    throw createError(401, "Refresh token not found");
  }

  /* * Hash raw cookie token. */
  const tokenHash = hashRefreshToken(refreshToken);
  /* * Start MongoDB session. */ const session = await mongoose.startSession();
  try {
    let result;
    /* * Transaction: * * Old token consumption * + * New token creation * * happen together. */ await session.withTransaction(
      async () => {
        /* Find current refresh token  */
        const storedToken = await RefreshToken.findOne({ tokenHash }).session(
          session,
        );
        /* * Token does not exist. */ if (!storedToken) {
          throw createError(401, "Invalid refresh token");
        }
        /*  Detect refresh-token reuse * ---- * * revokedAt + * replacedByTokenHash * * means this token was already consumed * by a previous refresh operation. */
        if (storedToken.revokedAt && storedToken.replacedByTokenHash) {
          await revokeTokenFamily(storedToken.familyId, session);
          const error = createError(
            401,
            "Refresh token reuse detected. Please login again.",
          );
          error.code = "REFRESH_TOKEN_REUSE";
          throw error;
        }
        /*    Token revoked for another reason  */
        if (storedToken.revokedAt) {
          const error = createError(401, "Refresh token has been revoked");
          error.code = "REFRESH_TOKEN_REVOKED";
          throw error;
        }
        /*   Check expiration */
        if (storedToken.expiresAt.getTime() <= Date.now()) {
          const error = createError(401, "Refresh token expired");
          error.code = "REFRESH_TOKEN_EXPIRED";
          throw error;
        }
        /*  5. Find user */
        const user = await User.findById(storedToken.userId).session(session);
        if (!user) {
          throw createError(401, "User not found");
        }
        /*  Check account status */
        if (!user.isActive) {
          throw createError(403, "Your account is inactive");
        }
        /*  Generate NEW refresh token  */

        const newRefreshToken = generateRefreshToken();

        /* * Hash new token. */
        const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

        const now = new Date();
        /* ATOMICALLY consume OLD token  */
        const consumedToken = await RefreshToken.findOneAndUpdate(
          {
            _id: storedToken._id,
            tokenHash,
            revokedAt: null,
            expiresAt: { $gt: now },
          },
          {
            $set: {
              revokedAt: now,
              lastUsedAt: now,
              replacedByTokenHash: newRefreshTokenHash,
            },
          },
          { new: true, session },
        );

        /*  Atomic update failed */
        if (!consumedToken) {
          /* * Check latest state. */
          const latestToken = await RefreshToken.findById(
            storedToken._id,
          ).session(session);

          /* * Another request already rotated it. */
          if (latestToken?.revokedAt && latestToken?.replacedByTokenHash) {
            const error = createError(
              401,
              "Refresh token has already been rotated",
            );
            error.code = "REFRESH_TOKEN_ALREADY_ROTATED";
            throw error;
          }
          const error = createError(401, "Refresh token is no longer valid");
          error.code = "REFRESH_TOKEN_CONSUME_FAILED";
          throw error;
        }
        /*  Create NEW refresh token  */
        await RefreshToken.create(
          [
            {
              userId: user._id,
              tokenHash: newRefreshTokenHash,
              familyId: storedToken.familyId,
              expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
              userAgent,
              ipAddress,
            },
          ],
          { session },
        );
        //Generate NEW access token
        const accessToken = createAccessToken({
          sub: user._id.toString(),
          role: user.role,
        });

        //Safe user object
        const safeUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        };

        // Store result outside transaction.
        result = {
          accessToken,
          /* * This raw token will ONLY be placed * into the HttpOnly cookie by controller. */
          refreshToken: newRefreshToken,
          user: safeUser,
        };
      },
    );
    return result;
  } finally {
    /* * Always close MongoDB session. */
    await session.endSession();
  }
};

// Logout user
const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) {
    // Cookie may already be cleared.
    // Logout should remain idempotent.
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

// lOGOUT ALL DEVICES
const logoutAllUserSessions = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

//forgot password
const forgotPasswordService = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  /* * IMPORTANT: * Do not reveal whether the email exists. */
  if (!user) {
    return;
  } // Remove any previous unused reset tokens
  await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });
  // Generate cryptographically secure token
  const rawToken = generatePasswordResetToken(); // Store only the hash
  const tokenHash = hashPasswordResetToken(rawToken); // Token expires after 15 minutes
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MS);

  await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });
  /* * IMPORTANT: * rawToken should be sent only through the * password-reset email. * * Example: * https://your-frontend.com/reset-password?token=${rawToken} */
  return {
    user,
    rawToken,
  };
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllUserSessions,
  forgotPasswordService,
};
