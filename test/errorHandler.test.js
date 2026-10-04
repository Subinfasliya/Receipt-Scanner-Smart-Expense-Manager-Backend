const test = require("node:test");
const assert = require("node:assert/strict");
const errorHandler = require("../src/middlewares/errorHandler");

const captureResponse = () => ({
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("expired access tokens return a safe, stable 401 response", () => {
  const response = captureResponse();
  const error = new Error("jwt expired");
  error.name = "TokenExpiredError";

  errorHandler(error, { method: "GET" }, response, () => {});

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, {
    success: false,
    message: "Your access token has expired.",
    errors: null,
    code: "ACCESS_TOKEN_EXPIRED",
  });
  assert.equal(JSON.stringify(response.body).includes("jwt expired"), false);
});

test("malformed access tokens return a safe 401 response", () => {
  const response = captureResponse();
  const error = new Error("secret JWT parser details");
  error.name = "JsonWebTokenError";

  errorHandler(error, { method: "GET" }, response, () => {});

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.code, "INVALID_ACCESS_TOKEN");
  assert.equal(response.body.message, "Invalid access token.");
  assert.equal(JSON.stringify(response.body).includes("secret JWT parser details"), false);
});