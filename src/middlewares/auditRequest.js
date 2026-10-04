const AuditLog = require("../models/auditLogModel");

const auditRequest = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  res.once("finish", () => {
    AuditLog.create({
      userId: req.user?._id || null,
      action: `${req.method} ${req.baseUrl}${req.route?.path || ""}`.slice(0, 160),
      resourceId: req.params?.id || null,
      statusCode: res.statusCode,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")?.slice(0, 300) || null,
    }).catch(() => {});
  });
  return next();
};

module.exports = auditRequest;