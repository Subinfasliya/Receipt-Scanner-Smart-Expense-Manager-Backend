const createError = require("../../utils/createError");

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Authentication must happen first.
    if (!req.user) {
      return next(createError(401, "Authentication required"));
    }

    // Check whether user's role
    // is included in allowed roles.
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createError(403, "You do not have permission to access this resource"),
      );
    }

    next();
  };
};

module.exports = requireRole
