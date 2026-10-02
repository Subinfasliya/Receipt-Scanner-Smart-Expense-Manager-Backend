const {
  register,
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmailController,
} = require("../../controllers/authController");
const { protect } = require("../../middlewares/auth/authMiddleware");
const validate = require("../../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../../middlewares/validations/authValidation");

const authRouter = require("express").Router();

authRouter.post("/register", validate(registerSchema), register);

authRouter.post("/login", validate(loginSchema), login);

authRouter.post("/refresh", refresh);

authRouter.get("/me", protect, getMe);

authRouter.post("/logout", logout);

authRouter.post("/logout-all", protect, logoutAll);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.post(
  "/change-password",
  validate(changePasswordSchema),
  protect,
  changePassword,
);

authRouter.get("/verify-email/:token", verifyEmailController);

module.exports = authRouter;
