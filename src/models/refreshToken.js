const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    replacedByTokenHash: {
      type: String,
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    // Useful for session/device management and security auditing.
    userAgent: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * MongoDB automatically removes the document
 * after expiresAt is reached.
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
