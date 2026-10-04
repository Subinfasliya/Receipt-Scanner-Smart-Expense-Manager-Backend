const mongoose = require("mongoose");

const backgroundJobSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["recurring-expense"], required: true },
    data: { recurringExpenseId: { type: mongoose.Schema.Types.ObjectId, required: true } },
    dedupeKey: { type: String, required: true, unique: true },
    runAt: { type: Date, required: true, index: true },
    state: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    lockExpiresAt: { type: Date, default: null },
    lastError: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true },
);

backgroundJobSchema.index({ state: 1, runAt: 1 });

module.exports = mongoose.model("BackgroundJob", backgroundJobSchema);