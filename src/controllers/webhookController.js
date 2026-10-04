const WebhookEvent = require("../models/webhookEventModel");
const Subscription = require("../models/subscriptionModel");
const { processPaymentCaptured } = require("./subscriptionController");
const env = require("../config/env");
const createError = require("../utils/createError");
const { successResponse } = require("../utils/apiResponse");

const { signatureIsValid } = require("../utils/webhookSignature");

const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.get("x-razorpay-signature");
    if (!signatureIsValid(req.rawBody, signature, env.razorpay.webhookSecret)) {
      throw createError(401, "Invalid webhook signature");
    }
    const eventId = req.get("x-razorpay-event-id");
    const eventType = req.body?.event;
    if (!eventId || typeof eventType !== "string" || eventId.length > 120) {
      throw createError(400, "Invalid webhook event");
    }
    const payment = req.body?.payload?.payment?.entity;
    const orderId = payment?.order_id || req.body?.payload?.order?.entity?.id || null;
    const paymentId = payment?.id || null;

    try {
      await WebhookEvent.updateOne(
        { eventId },
        { $setOnInsert: { eventId, eventType, paymentId, orderId, state: "received" } },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    const event = await WebhookEvent.findOneAndUpdate(
      {
        eventId,
        $or: [
          { state: "received" },
          { state: "failed" },
          { state: "processing", lockExpiresAt: { $lte: new Date() } },
        ],
      },
      { $set: { state: "processing", lockExpiresAt: new Date(Date.now() + 60000) }, $inc: { attempts: 1 } },
      { returnDocument: "after" },
    );
    if (!event) return successResponse(res, 200, "Webhook already processed");

    try {
      if (eventType === "payment.captured" && payment) {
        await processPaymentCaptured({ orderId, paymentId, amount: payment.amount, currency: payment.currency });
      } else if (eventType === "payment.failed" && orderId) {
        await Subscription.updateOne({ orderId, status: "pending" }, { $set: { status: "failed" } });
      }
      await WebhookEvent.updateOne({ _id: event._id }, { $set: { state: "processed", lockExpiresAt: null } });
      return successResponse(res, 200, "Webhook processed");
    } catch (error) {
      await WebhookEvent.updateOne({ _id: event._id }, { $set: { state: "failed", lockExpiresAt: null } });
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = { razorpayWebhook };