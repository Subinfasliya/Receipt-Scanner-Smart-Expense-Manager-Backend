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

//---------------------------------------------------------------------------
// AUTHENTICATION
//--------------------------------------------------------------------------
authRouter.post("/register", validate(registerSchema), register);

authRouter.post("/login", validate(loginSchema), login);

authRouter.post("/refresh", refresh);

authRouter.get("/me", protect, getMe);

//------------------------------------------------------------------------
// SESSION
//------------------------------------------------------------------------

authRouter.post("/logout", logout);

authRouter.post("/logout-all", protect, logoutAll);

// ----------------------------------------------------------------------
// PASSWORD
// ----------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
//  EMAIL VERIFICATION
// ---------------------------------------------------------------------------

authRouter.get("/verify-email/:token", verifyEmailController);

authRouter.post("/resend-verification", resendVerificationEmailController);

module.exports = authRouter;
