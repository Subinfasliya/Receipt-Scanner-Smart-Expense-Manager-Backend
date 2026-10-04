const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["monthly", "annual"], required: true },
    status: { type: String, enum: ["pending", "active", "failed", "expired", "cancelled"], default: "pending", index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR", enum: ["INR"] },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);