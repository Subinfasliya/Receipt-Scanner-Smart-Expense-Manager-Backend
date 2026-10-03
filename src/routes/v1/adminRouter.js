const { getAllUsers } = require("../../controllers/adminController");
const protect = require("../../middlewares/auth/authMiddleware");
const requireRole = require("../../middlewares/auth/authorize");

const adminRouter = require("express").Router();

// ADMIN - GET ALL USERS
adminRouter.get("/users", protect, requireRole("admin"), getAllUsers);

module.exports = adminRouter;
