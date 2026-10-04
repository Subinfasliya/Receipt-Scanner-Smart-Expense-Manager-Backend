const mongoose = require("mongoose");
const createError = require("../utils/createError");

const requireOwnership = ({
  Model,
  paramName = "id",
  ownerField = "userId",
}) => {
  return async (req, res, next) => {
    try {
      // ==========================================
      // 1. AUTHENTICATION CHECK
      // ==========================================

      if (!req.user) {
        throw createError(401, "Authentication required");
      }

      // ==========================================
      // 2. GET RESOURCE ID
      // ==========================================

      const resourceId = req.params[paramName];

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        throw createError(404, "Resource not found");
      }

      // ==========================================
      // 3. FIND RESOURCE
      // ==========================================

      const resource = await Model.findById(resourceId);

      if (!resource) {
        throw createError(404, "Resource not found");
      }

      // ==========================================
      // 4. CHECK OWNERSHIP
      // ==========================================

      const ownerId = resource[ownerField];

      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        throw createError(404, "Resource not found");
      }

      // ==========================================
      // 5. ATTACH RESOURCE
      // ==========================================

      req.resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireOwnership,
};
