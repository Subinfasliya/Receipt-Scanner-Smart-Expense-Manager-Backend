const Joi = require("joi");
const {
  createRecurringExpense,
  listRecurringExpenses,
  updateRecurringExpense,
  deleteRecurringExpense,
} = require("../../controllers/recurringExpenseController");
const protect = require("../../middlewares/auth/authMiddleware");
const requirePremium = require("../../middlewares/auth/requirePremium");
const auditRequest = require("../../middlewares/auditRequest");
const { requireOwnership } = require("../../middlewares/ownershipMiddleware");
const RecurringExpense = require("../../models/recurringExpenseModel");
const validate = require("../../middlewares/validate");

const recurringExpenseRouter = require("express").Router();
const createSchema = Joi.object({
  merchant: Joi.string().trim().min(1).max(120).required(),
  amount: Joi.number().positive().precision(2).max(100000000).required(),
  category: Joi.string().trim().max(80).allow("", null),
  frequency: Joi.string().valid("weekly", "monthly", "yearly").required(),
  nextRunAt: Joi.date().required().custom((value, helpers) => {
    const nextYear = new Date();
    nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
    return value > new Date() && value <= nextYear ? value : helpers.error("date.invalid");
  }),
});
const activeSchema = Joi.object({ active: Joi.boolean().required() });

recurringExpenseRouter.get("/", protect, requirePremium, listRecurringExpenses);
recurringExpenseRouter.post("/", protect, requirePremium, auditRequest, validate(createSchema), createRecurringExpense);
recurringExpenseRouter.patch(
  "/:id",
  protect,
  requirePremium,
  auditRequest,
  requireOwnership({ Model: RecurringExpense }),
  validate(activeSchema),
  updateRecurringExpense,
);
recurringExpenseRouter.delete(
  "/:id",
  protect,
  requirePremium,
  auditRequest,
  requireOwnership({ Model: RecurringExpense }),
  deleteRecurringExpense,
);

module.exports = recurringExpenseRouter;