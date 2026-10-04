const mongoose = require("mongoose");

const recurringExpenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    merchant: { type: String, required: true, trim: true, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 1, max: 10000000000 },
    category: { type: String, trim: true, maxlength: 80 },
    frequency: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
    nextRunAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RecurringExpense", recurringExpenseSchema);