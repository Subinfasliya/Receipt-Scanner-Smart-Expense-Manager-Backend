const { getAllUsers } = require("../../controllers/adminController");
const { listAuditLogs } = require("../../controllers/auditController");
const protect = require("../../middlewares/auth/authMiddleware");
const requireRole = require("../../middlewares/auth/authorize");

const adminRouter = require("express").Router();

// ADMIN - GET ALL USERS
adminRouter.get("/users", protect, requireRole("admin"), getAllUsers);
adminRouter.get("/audit-logs", protect, requireRole("admin"), listAuditLogs);

module.exports = adminRouter;
