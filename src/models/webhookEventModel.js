const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true, maxlength: 100 },
    paymentId: { type: String, default: null },
    orderId: { type: String, default: null, index: true },
    state: { type: String, enum: ["received", "processing", "processed", "failed"], default: "received", index: true },
    attempts: { type: Number, default: 0 },
    lockExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);