const Expense = require("../models/expenseModel");
const { successResponse } = require("../utils/apiResponse");
const { generateInsights } = require("../services/insightService");

const buildRange = (req) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to || to - from > 2 * 366 * 24 * 60 * 60 * 1000) {
    const error = new Error("Provide a valid date range of at most two years");
    error.statusCode = 400;
    throw error;
  }
  return { from, to };
};

const aggregateSpending = async (userId, from, to) => {
  const results = await Expense.aggregate([
    { $match: { userId, expenseDate: { $gte: from, $lte: to } } },
    {
      $facet: {
        totals: [{ $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }],
        categories: [{ $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }],
        months: [{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
      },
    },
  ]);
  const result = results[0] || { totals: [], categories: [], months: [] };
  return {
    total: result.totals[0]?.amount || 0,
    count: result.totals[0]?.count || 0,
    categories: result.categories.map(({ _id, ...item }) => ({ category: _id, ...item })),
    months: result.months.map(({ _id, ...item }) => ({ month: _id, ...item })),
  };
};

const summary = async (req, res, next) => {
  try {
    const range = buildRange(req);
    const data = await aggregateSpending(req.user._id, range.from, range.to);
    return successResponse(res, 200, "Analytics retrieved successfully", { ...range, ...data });
  } catch (error) {
    return next(error);
  }
};

const exportExpenses = async (req, res, next) => {
  try {
    const { from, to } = buildRange(req);
    const expenses = await Expense.find({ userId: req.user._id, expenseDate: { $gte: from, $lte: to } })
      .select("merchant amount category expenseDate notes")
      .sort({ expenseDate: 1 })
      .limit(50000)
      .lean();
    const safeCell = (value) => {
      let text = String(value ?? "");
      if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const lines = [
      ["date", "merchant", "amount", "category", "notes"].map(safeCell).join(","),
      ...expenses.map((item) => [item.expenseDate.toISOString(), item.merchant, item.amount, item.category, item.notes].map(safeCell).join(",")),
    ];
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="expenses.csv"',
      "Cache-Control": "no-store",
    });
    return res.status(200).send(lines.join("\r\n"));
  } catch (error) {
    return next(error);
  }
};

const insights = async (req, res, next) => {
  try {
    const now = new Date();
    const currentFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousFrom = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const [current, previous, categories, months] = await Promise.all([
      Expense.aggregate([{ $match: { userId: req.user._id, expenseDate: { $gte: currentFrom, $lte: now } } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
      Expense.aggregate([{ $match: { userId: req.user._id, expenseDate: { $gte: previousFrom, $lt: currentFrom } } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
      Expense.aggregate([{ $match: { userId: req.user._id, expenseDate: { $gte: currentFrom, $lte: now } } }, { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, amount: { $sum: "$amount" } } }, { $sort: { amount: -1 } }, { $limit: 10 }]),
      Expense.aggregate([{ $match: { userId: req.user._id, expenseDate: { $gte: previousFrom, $lte: now } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } }, amount: { $sum: "$amount" } } }, { $sort: { _id: 1 } }]),
    ]);
    const data = {
      totals: { currentPeriod: current[0]?.amount || 0, previousPeriod: previous[0]?.amount || 0 },
      categories: categories.map(({ _id, amount }) => ({ category: _id, amount })),
      months: months.map(({ _id, amount }) => ({ month: _id, amount })),
    };
    const result = await generateInsights(data);
    return successResponse(res, 200, "Spending insights generated", result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { summary, exportExpenses, insights };