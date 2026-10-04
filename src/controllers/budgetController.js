const Budget = require("../models/budgetModel");
const Expense = require("../models/expenseModel");
const { successResponse } = require("../utils/apiResponse");
const createError = require("../utils/createError");
const { toMinorUnits, fromMinorUnits } = require("../utils/money");

const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getUTCFullYear();
    const month = Number(req.query.month) || now.getUTCMonth() + 1;
    if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
      throw createError(400, "Year or month is outside the supported range");
    }
    const [budgets, spend] = await Promise.all([
      Budget.find({ userId: req.user._id, year, month }).sort({ category: 1 }).lean(),
      Expense.aggregate([
        { $match: { userId: req.user._id, expenseDate: { $gte: new Date(Date.UTC(year, month - 1, 1)), $lt: new Date(Date.UTC(year, month, 1)) } } },
        { $group: { _id: "$category", amountMinor: { $sum: "$amountMinor" } } },
      ]),
    ]);
    const spentByCategory = new Map(spend.map((item) => [item._id || "Uncategorized", item.amountMinor]));
    const result = budgets.map((budget) => {
      const spentMinor = spentByCategory.get(budget.category) || 0;
      const remainingMinor = Math.max(0, budget.limitMinor - spentMinor);
      const { limitMinor, ...fields } = budget;
      return {
        ...fields,
        limit: fromMinorUnits(limitMinor),
        spent: fromMinorUnits(spentMinor),
        remaining: fromMinorUnits(remainingMinor),
        percentUsed: Math.round((spentMinor / limitMinor) * 100),
      };
    });
    return successResponse(res, 200, "Budgets retrieved successfully", { year, month, items: result });
  } catch (error) {
    return next(error);
  }
};

const upsertBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const year = req.body.year || now.getUTCFullYear();
    const month = req.body.month || now.getUTCMonth() + 1;
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category: req.body.category, year, month },
      { $set: { limitMinor: toMinorUnits(req.body.limit) } },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    const { limitMinor, ...fields } = budget.toObject();
    return successResponse(res, 200, "Budget saved successfully", {
      ...fields,
      limit: fromMinorUnits(limitMinor),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getBudgets, upsertBudget };