const createError = require("../../utils/createError");


const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, "Authentication required"));
  }

  if (!req.user.isEmailVerified) {
    return next(createError(403, "Please verify your email address first"));
  }

  next();
};

module.exports = {
  requireEmailVerified,
};
