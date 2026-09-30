const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllUserSessions,
  forgotPasswordService,
} = require("../services/authService");
const { sendPasswordResetEmail } = require("../services/emailService");
const { successResponse } = require("../utils/apiResponse");
const { setRefreshCookie, clearRefreshCookie } = require("../utils/cookies");

const register = async (req, res, next) => {
  try {
    const result = await registerUser({
      ...req.body,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    /*
     * Refresh token goes ONLY into HttpOnly cookie.
     */
    setRefreshCookie(res, result.refreshToken);

    return successResponse(
      res,
      201,
      "User registered successfully",
      result.user,
    );
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    //  Authenticate user

    const result = await loginUser({
      ...req.body,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    //Store refresh token in HttpOnly cookie.

    setRefreshCookie(res, result.refreshToken);

    return successResponse(res, 200, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const result = await refreshAccessToken({
      refreshToken,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    setRefreshCookie(res, result.refreshToken);

    return successResponse(res, 200, "Token refreshed successfully", {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};

// me
const getMe = async (req, res, next) => {
  try {
    return successResponse(
      res,
      200,
      "Authenticated user retrieved successfully",
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isEmailVerified: req.user.isEmailVerified,
          isActive: req.user.isActive,
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await logoutUser({ refreshToken });
    // Always clear the browser cookie
    clearRefreshCookie(res);
    return successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// Logout All Devices
const logoutAll = async (req, res, next) => {
  try {
    await logoutAllUserSessions(req.user_id);

    //clear the current browser's refresh cookie
    clearRefreshCookie(res);

    return successResponse(
      res,
      200,
      "Logged out from all devices successfully",
    );
  } catch (error) {
    next(error);
  }
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService({
      email,
    });

    /* * If an account exists, an email will be sent. * * If it doesn't exist, we intentionally return * the exact same response. */

    if (result) {
      await sendPasswordResetEmail({
        email: result.user.email,
        name: result.user.name,
        resetToken: result.rawToken,
      });
    }

    return successResponse(
      res,
      200,
      "If an account exists for this email, reset instructions have been sent.",
    );
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
  forgotPassword,
};
