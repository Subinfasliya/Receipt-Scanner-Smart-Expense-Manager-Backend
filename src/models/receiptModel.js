const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
    publicId: { type: String, required: true, unique: true },
    secureUrl: { type: String, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true, max: 5 * 1024 * 1024 },
    extracted: {
      merchant: { type: String, maxlength: 120 },
      amount: { type: Number, min: 0 },
      expenseDate: { type: Date },
    },
  },
  { timestamps: true },
);

receiptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Receipt", receiptSchema);