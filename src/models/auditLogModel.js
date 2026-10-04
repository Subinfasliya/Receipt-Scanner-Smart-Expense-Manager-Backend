const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, maxlength: 160 },
    resourceId: { type: String, maxlength: 80, default: null },
    statusCode: { type: Number, required: true },
    ipAddress: { type: String, maxlength: 64, default: null },
    userAgent: { type: String, maxlength: 300, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

module.exports = mongoose.model("AuditLog", auditLogSchema);