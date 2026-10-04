const createError = require("../../utils/createError");

const requirePremium = (req, res, next) => {
  if (!req.user) return next(createError(401, "Authentication required"));
  const hasPremium =
    req.user.isPremium === true &&
    (!req.user.premiumExpiresAt || req.user.premiumExpiresAt > new Date());
  if (!hasPremium) return next(createError(403, "An active premium subscription is required"));
  return next();
};

module.exports = requirePremium;