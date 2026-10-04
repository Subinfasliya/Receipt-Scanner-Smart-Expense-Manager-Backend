const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Subscription = require("../src/models/subscriptionModel");
const User = require("../src/models/userModel");
const { processPaymentCaptured } = require("../src/controllers/subscriptionController");

test("payment capture commits subscription and entitlement in one transaction", async () => {
  const userId = new mongoose.Types.ObjectId();
  const session = {
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  };
  const subscription = {
    userId,
    status: "pending",
    plan: "monthly",
    amount: 49900,
    currency: "INR",
    saveOptions: [],
    async save(options) {
      this.saveOptions.push(options);
    },
  };
  const user = {
    _id: userId,
    isActive: true,
    isPremium: false,
    premiumExpiresAt: null,
    saveOptions: [],
    async save(options) {
      this.saveOptions.push(options);
    },
  };
  const originalStartSession = mongoose.startSession;
  const originalFindSubscription = Subscription.findOne;
  const originalFindUser = User.findById;
  mongoose.startSession = async () => session;
  Subscription.findOne = () => ({ session: async () => subscription });
  User.findById = () => ({ session: async () => user });

  try {
    await processPaymentCaptured({
      orderId: "order_test",
      paymentId: "pay_test",
      amount: 49900,
      currency: "INR",
    });

    assert.equal(subscription.status, "active");
    assert.equal(subscription.paymentId, "pay_test");
    assert.equal(user.isPremium, true);
    assert.ok(user.premiumExpiresAt > new Date());
    assert.equal(subscription.saveOptions[0].session, session);
    assert.equal(user.saveOptions[0].session, session);

    const originalExpiry = subscription.expiresAt;
    user.isPremium = false;
    user.premiumExpiresAt = null;
    await processPaymentCaptured({
      orderId: "order_test",
      paymentId: "pay_test",
      amount: 49900,
      currency: "INR",
    });
    assert.equal(subscription.expiresAt, originalExpiry);
    assert.equal(subscription.saveOptions.length, 1);
    assert.equal(user.isPremium, true);
    assert.equal(user.premiumExpiresAt, originalExpiry);
  } finally {
    mongoose.startSession = originalStartSession;
    Subscription.findOne = originalFindSubscription;
    User.findById = originalFindUser;
  }
});

test("payment capture rejects a mismatched amount without activating premium", async () => {
  const session = {
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  };
  const subscription = {
    status: "pending",
    amount: 49900,
    currency: "INR",
  };
  const originalStartSession = mongoose.startSession;
  const originalFindSubscription = Subscription.findOne;
  mongoose.startSession = async () => session;
  Subscription.findOne = () => ({ session: async () => subscription });

  try {
    await assert.rejects(
      processPaymentCaptured({ orderId: "order_test", paymentId: "pay_test", amount: 1, currency: "INR" }),
      /amount or currency does not match/,
    );
    assert.equal(subscription.status, "pending");
  } finally {
    mongoose.startSession = originalStartSession;
    Subscription.findOne = originalFindSubscription;
  }
});