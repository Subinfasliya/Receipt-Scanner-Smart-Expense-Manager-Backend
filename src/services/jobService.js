const BackgroundJob = require("../models/backgroundJobModel");
const RecurringExpense = require("../models/recurringExpenseModel");
const Expense = require("../models/expenseModel");

const buildJobKey = (recurringId, runAt) => `${recurringId}:${new Date(runAt).toISOString()}`;

const enqueueRecurringExpense = async (recurring) => {
  const runAt = new Date(recurring.nextRunAt);
  const dedupeKey = buildJobKey(recurring._id, runAt);
  const restored = await BackgroundJob.updateOne(
    { dedupeKey, state: { $in: ["completed", "failed"] } },
    { $set: { state: "pending", runAt, attempts: 0, lockExpiresAt: null, lastError: null } },
  );
  if (restored.modifiedCount) return;
  await BackgroundJob.updateOne(
    { dedupeKey },
    {
      $setOnInsert: {
        type: "recurring-expense",
        data: { recurringExpenseId: recurring._id },
        runAt,
        state: "pending",
      },
    },
    { upsert: true },
  );
};

const advanceDate = (date, frequency) => {
  const next = new Date(date);
  if (frequency === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  if (frequency === "monthly") {
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const finalDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(day, finalDay));
  }
  if (frequency === "yearly") {
    const month = next.getUTCMonth();
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    next.setUTCMonth(month);
    const finalDay = new Date(Date.UTC(next.getUTCFullYear(), month + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(day, finalDay));
  }
  return next;
};

const processRecurringJob = async (job) => {
  const recurring = await RecurringExpense.findById(job.data.recurringExpenseId);
  if (!recurring || !recurring.active) return;

  const scheduledAt = new Date(job.runAt);
  const idempotencyKey = `recurring:${buildJobKey(recurring._id, scheduledAt)}`;
  try {
    await Expense.create({
      userId: recurring.userId,
      merchant: recurring.merchant,
      amount: recurring.amount,
      category: recurring.category,
      expenseDate: scheduledAt,
      idempotencyKey,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const nextRunAt = advanceDate(scheduledAt, recurring.frequency);
  await RecurringExpense.updateOne(
    { _id: recurring._id, nextRunAt: scheduledAt, active: true },
    { $set: { nextRunAt } },
  );
  recurring.nextRunAt = nextRunAt;
  if (recurring.active) await enqueueRecurringExpense(recurring);
};

const processOneJob = async () => {
  const now = new Date();
  const job = await BackgroundJob.findOneAndUpdate(
    {
      attempts: { $lt: 5 },
      $or: [
        { state: "pending", runAt: { $lte: now } },
        { state: "processing", lockExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: { state: "processing", lockExpiresAt: new Date(now.getTime() + 60000) },
      $inc: { attempts: 1 },
    },
    { sort: { runAt: 1 }, returnDocument: "after" },
  );
  if (!job) return false;

  try {
    if (job.type === "recurring-expense") await processRecurringJob(job);
    await BackgroundJob.updateOne({ _id: job._id, state: "processing" }, {
      $set: { state: "completed", lockExpiresAt: null, lastError: null },
    });
  } catch (error) {
    const terminal = job.attempts >= 5;
    await BackgroundJob.updateOne({ _id: job._id, state: "processing" }, {
      $set: {
        state: terminal ? "failed" : "pending",
        runAt: new Date(Date.now() + Math.min(300000, 1000 * 2 ** job.attempts)),
        lockExpiresAt: null,
        lastError: String(error.message || "Job failed").slice(0, 500),
      },
    });
  }
  return true;
};

const startJobWorker = () => {
  let stopped = false;
  let running = false;
  const poll = async () => {
    if (stopped || running) return;
    running = true;
    try {
      for (let count = 0; count < 10 && await processOneJob(); count += 1) {
        if (stopped) break;
      }
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void poll(), 5000);
  timer.unref();
  void poll();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
};

module.exports = { enqueueRecurringExpense, startJobWorker, advanceDate };