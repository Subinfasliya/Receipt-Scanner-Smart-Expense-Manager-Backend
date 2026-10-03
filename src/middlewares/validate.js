const createError = require("../utils/createError");

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body ?? {}, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(({ message, path }) => ({
        message,
        path,
      }));
      return next(createError(400, "Validation failed", details));
    }

    req.body = value;
    next();
  };
};


module.exports = validate