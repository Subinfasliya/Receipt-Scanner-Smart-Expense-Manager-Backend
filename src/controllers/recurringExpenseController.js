const RecurringExpense = require("../models/recurringExpenseModel");
const { enqueueRecurringExpense } = require("../services/jobService");
const { successResponse } = require("../utils/apiResponse");

const createRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.create({ ...req.body, userId: req.user._id });
    try {
      await enqueueRecurringExpense(recurring);
    } catch (error) {
      await RecurringExpense.deleteOne({ _id: recurring._id, userId: req.user._id });
      throw error;
    }
    return successResponse(res, 201, "Recurring expense scheduled", recurring);
  } catch (error) {
    return next(error);
  }
};

const listRecurringExpenses = async (req, res, next) => {
  try {
    const items = await RecurringExpense.find({ userId: req.user._id }).sort({ nextRunAt: 1 }).lean();
    return successResponse(res, 200, "Recurring expenses retrieved successfully", items);
  } catch (error) {
    return next(error);
  }
};

const updateRecurringExpense = async (req, res, next) => {
  try {
    req.resource.active = req.body.active;
    await req.resource.save();
    if (req.resource.active) await enqueueRecurringExpense(req.resource);
    return successResponse(res, 200, "Recurring expense updated", req.resource);
  } catch (error) {
    return next(error);
  }
};

const deleteRecurringExpense = async (req, res, next) => {
  try {
    await req.resource.deleteOne();
    return successResponse(res, 200, "Recurring expense deleted");
  } catch (error) {
    return next(error);
  }
};

module.exports = { createRecurringExpense, listRecurringExpenses, updateRecurringExpense, deleteRecurringExpense };