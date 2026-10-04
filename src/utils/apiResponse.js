const successResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, statusCode, message, errors = null, code = null) => {
  const body = {
    success: false,
    message,
    errors,
  };
  if (code) body.code = code;
  return res.status(statusCode).json(body);
};

module.exports = {
  successResponse,
  errorResponse,
};