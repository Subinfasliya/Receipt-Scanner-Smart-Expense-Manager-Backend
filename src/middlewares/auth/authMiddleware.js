const User = require("../../models/userModel");
const createError = require("../../utils/createError");
const { verifyAccessToken } = require("../../utils/jwt");


const protect = async (req, res, next) => {
  try {
    //  Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError(401, "Authorization header is required");
    }

    //  Check Bearer format
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw createError(401, "Invalid authorization format");
    }

    //  Verify access token
    const decoded = verifyAccessToken(token);

    //  Get user ID from JWT `sub`
    const userId = decoded.sub;

    if (!userId) {
      throw createError(401, "Invalid access token");
    }

    //  Find user
    const user = await User.findById(userId);

    if (!user) {
      throw createError(401, "User not found");
    }

    //  Check account status
    if (!user.isActive) {
      throw createError(403, "Your account is inactive");
    }

    //  Attach user to request
    req.user = user;

    //  Continue to controller
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
