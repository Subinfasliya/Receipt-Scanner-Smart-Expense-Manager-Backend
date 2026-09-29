const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require("../services/authService");
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

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
};
