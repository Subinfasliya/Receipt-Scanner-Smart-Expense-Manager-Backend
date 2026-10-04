const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const RefreshToken = require("../src/models/refreshToken");
const { logoutAll } = require("../src/controllers/authController");

test("logout-all only revokes the authenticated user's sessions", async () => {
  const userId = new mongoose.Types.ObjectId();
  const originalUpdateMany = RefreshToken.updateMany;
  let filter;
  RefreshToken.updateMany = async (query) => {
    filter = query;
    return { modifiedCount: 1 };
  };
  const response = {
    clearCookie() {},
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  try {
    await logoutAll({ user: { _id: userId } }, response, (error) => {
      throw error;
    });
    assert.equal(filter.userId, userId);
    assert.equal(filter.revokedAt, null);
    assert.equal(response.statusCode, 200);
  } finally {
    RefreshToken.updateMany = originalUpdateMany;
  }
});