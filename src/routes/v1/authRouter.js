const {
  register,
  login,
  refresh,
  getMe,
  logout,
} = require("../../controllers/authController");
const { protect } = require("../../middlewares/auth/authMiddleware");
const validate = require("../../middlewares/validate");
const {
  registerSchema,
  loginSchema,
} = require("../../middlewares/validations/authValidation");

const authRouter = require("express").Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.get("/me", protect, getMe);
authRouter.post("/logout", logout)

module.exports = authRouter;
