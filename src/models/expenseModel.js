const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    merchant: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    expenseDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    idempotencyKey: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

expenseSchema.index({ userId: 1, expenseDate: -1 });
expenseSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Expense", expenseSchema);
