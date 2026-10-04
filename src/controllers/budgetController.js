const Budget = require("../models/budgetModel");
const Expense = require("../models/expenseModel");
const { successResponse } = require("../utils/apiResponse");
const createError = require("../utils/createError");

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
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      ]),
    ]);
    const spentByCategory = new Map(spend.map((item) => [item._id || "Uncategorized", item.amount]));
    const result = budgets.map((budget) => {
      const spent = spentByCategory.get(budget.category) || 0;
      return { ...budget, spent, remaining: Math.max(0, budget.limit - spent), percentUsed: Math.round((spent / budget.limit) * 100) };
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
      { $set: { limit: req.body.limit } },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return successResponse(res, 200, "Budget saved successfully", budget);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getBudgets, upsertBudget };