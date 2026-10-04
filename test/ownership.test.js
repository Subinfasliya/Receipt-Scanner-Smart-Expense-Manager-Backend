const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { requireOwnership } = require("../src/middlewares/ownershipMiddleware");
const Expense = require("../src/models/expenseModel");

test("expense schema requires a user owner", () => {
  assert.equal(Expense.schema.path("userId").isRequired, true);
  assert.equal(Expense.schema.path("amountMinor").options.min, 0);
});

test("ownership middleware exposes only resources belonging to the user", async () => {
  const userId = new mongoose.Types.ObjectId();
  const resource = { userId };
  const middleware = requireOwnership({
    Model: { findById: async () => resource },
  });
  const req = { user: { _id: userId }, params: { id: userId.toString() } };
  let forwardedError;

  await middleware(req, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, undefined);
  assert.equal(req.resource, resource);
});

test("ownership middleware hides another user's resource", async () => {
  const middleware = requireOwnership({
    Model: { findById: async () => ({ userId: new mongoose.Types.ObjectId() }) },
  });
  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    params: { id: new mongoose.Types.ObjectId().toString() },
  };
  let forwardedError;

  await middleware(req, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError.statusCode, 404);
  assert.equal(forwardedError.message, "Resource not found");
});