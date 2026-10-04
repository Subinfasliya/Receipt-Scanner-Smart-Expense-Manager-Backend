const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    year: { type: Number, required: true, min: 2000, max: 2200 },
    month: { type: Number, required: true, min: 1, max: 12 },
    limit: { type: Number, required: true, min: 0.01, max: 100000000 },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, year: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);