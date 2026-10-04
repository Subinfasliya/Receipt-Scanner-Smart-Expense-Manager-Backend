const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/userModel");
const { seedAdminUser } = require("../src/services/adminSeedService");

test("seedAdminUser creates an admin user when none exists", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  try {
    User.findOne = async () => null;
    User.create = async (payload) => {
      assert.equal(payload.role, "admin");
      assert.equal(payload.email, "admin@scanspend.local");
      return {
        _id: "admin-id",
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
    };

    const result = await seedAdminUser({
      name: "System Administrator",
      email: "admin@scanspend.local",
      password: "StrongPass123!",
    });

    assert.equal(result.created, true);
    assert.equal(result.user.email, "admin@scanspend.local");
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});
