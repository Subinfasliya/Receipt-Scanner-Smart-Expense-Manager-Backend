const AuditLog = require("../models/auditLogModel");
const { successResponse } = require("../utils/apiResponse");

const listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const [items, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(),
    ]);
    return successResponse(res, 200, "Audit logs retrieved", { items, page, limit, total });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listAuditLogs };