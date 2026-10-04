const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const env = require("../config/env");
const createError = require("../utils/createError");
const { successResponse } = require("../utils/apiResponse");

const getRazorpay = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw createError(503, "Subscription payments are not configured");
  }
  return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
};

const startCheckout = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const amount = plan === "monthly" ? env.razorpay.monthlyAmount : env.razorpay.annualAmount;
    if (!Number.isSafeInteger(amount) || amount < 100) throw createError(503, "Subscription pricing is not configured");

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `${req.user._id.toString()}-${Date.now()}`.slice(0, 40),
      notes: { userId: req.user._id.toString(), plan },
    });
    const subscription = await Subscription.create({
      userId: req.user._id,
      plan,
      orderId: order.id,
      amount,
      currency: "INR",
    });

    return successResponse(res, 201, "Payment order created", {
      subscriptionId: subscription._id,
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: env.razorpay.keyId,
      plan,
    });
  } catch (error) {
    return next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id, status: "active", expiresAt: { $gt: new Date() } })
      .sort({ expiresAt: -1 })
      .lean();
    return successResponse(res, 200, "Subscription retrieved", {
      premium: req.user.isPremium && (!req.user.premiumExpiresAt || req.user.premiumExpiresAt > new Date()),
      subscription,
    });
  } catch (error) {
    return next(error);
  }
};

const processPaymentCaptured = async ({ orderId, paymentId, amount, currency }) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const subscription = await Subscription.findOne({ orderId }).session(session);
      if (!subscription) return;
      if (subscription.amount !== amount || subscription.currency !== currency) {
        throw createError(400, "Payment amount or currency does not match the order");
      }

      const alreadyActivated = subscription.status === "active";
      if (alreadyActivated && subscription.paymentId !== paymentId) {
        throw createError(409, "Subscription was activated by a different payment");
      }
      if (!alreadyActivated && !["pending", "failed"].includes(subscription.status)) return;

      const user = await User.findById(subscription.userId).session(session);
      if (!user || !user.isActive) throw createError(404, "Subscription user not found");

      const now = new Date();
      if (!alreadyActivated) {
        const startsAt = user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
        const expiresAt = calculateExpiry(startsAt, subscription.plan);
        subscription.status = "active";
        subscription.paymentId = paymentId;
        subscription.startsAt = startsAt;
        subscription.expiresAt = expiresAt;
        await subscription.save({ session });
      }

      const currentExpiry = user.premiumExpiresAt > now ? user.premiumExpiresAt : null;
      const subscriptionExpiry = subscription.expiresAt;
      const effectiveExpiry = currentExpiry && currentExpiry > subscriptionExpiry
        ? currentExpiry
        : subscriptionExpiry;
      user.isPremium = effectiveExpiry > now;
      user.premiumExpiresAt = effectiveExpiry;
      if (!currentExpiry || subscriptionExpiry >= currentExpiry) {
        user.subscriptionPlan = subscription.plan;
      }
      await user.save({ session, validateBeforeSave: false });
    });
  } finally {
    await session.endSession();
  }
};

const calculateExpiry = (start, plan) => {
  const expiresAt = new Date(start);
  const day = expiresAt.getUTCDate();
  const month = expiresAt.getUTCMonth();
  expiresAt.setUTCDate(1);
  if (plan === "monthly") expiresAt.setUTCMonth(month + 1);
  else expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  const finalDay = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0)).getUTCDate();
  expiresAt.setUTCDate(Math.min(day, finalDay));
  return expiresAt;
};

module.exports = { startCheckout, getSubscription, processPaymentCaptured, calculateExpiry };