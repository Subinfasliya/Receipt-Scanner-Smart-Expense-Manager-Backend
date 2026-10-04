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
  resendVerificationEmailController,
} = require("../../controllers/authController");
const protect  = require("../../middlewares/auth/authMiddleware");
const validate = require("../../middlewares/validate");
const trustedOrigin = require("../../middlewares/auth/trustedOrigin");
const rateLimit = require("express-rate-limit");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../../middlewares/validations/authValidation");

const authRouter = require("express").Router();
const createAuthLimiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginLimiter = createAuthLimiter(10);
const registrationLimiter = createAuthLimiter(5);
const recoveryLimiter = createAuthLimiter(5);
const refreshLimiter = createAuthLimiter(20);

//---------------------------------------------------------------------------
// AUTHENTICATION
//--------------------------------------------------------------------------
authRouter.post("/register", registrationLimiter, validate(registerSchema), register);

authRouter.post("/login", loginLimiter, validate(loginSchema), login);

authRouter.post("/refresh", refreshLimiter, trustedOrigin, refresh);

authRouter.get("/me", protect, getMe);

//------------------------------------------------------------------------
// SESSION
//------------------------------------------------------------------------

authRouter.post("/logout", trustedOrigin, logout);

authRouter.post("/logout-all", protect, logoutAll);

// ----------------------------------------------------------------------
// PASSWORD
// ----------------------------------------------------------------------

authRouter.post(
  "/forgot-password",
  recoveryLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

authRouter.post(
  "/reset-password",
  recoveryLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.post(
  "/change-password",
  validate(changePasswordSchema),
  protect,
  changePassword,
);

// ---------------------------------------------------------------------------
//  EMAIL VERIFICATION
// ---------------------------------------------------------------------------

authRouter.get("/verify-email/:token", recoveryLimiter, verifyEmailController);

authRouter.post("/resend-verification", recoveryLimiter, trustedOrigin, resendVerificationEmailController);

module.exports = authRouter;
