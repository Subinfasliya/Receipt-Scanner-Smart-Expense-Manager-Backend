const {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  validateExpenseQuery,
} = require("../../controllers/expenseController");
const protect = require("../../middlewares/auth/authMiddleware");
const { requireOwnership } = require("../../middlewares/ownershipMiddleware");
const Expense = require("../../models/expenseModel");
const validate = require("../../middlewares/validate");
const auditRequest = require("../../middlewares/auditRequest");
const {
  requireEmailVerified,
} = require("../../middlewares/email/emailMiddleware");
const Joi = require("joi");

const expenseRouter = require("express").Router();

const expenseSchema = Joi.object({
  merchant: Joi.string().trim().min(1).max(120).required(),
  amount: Joi.number().positive().max(100000000).precision(2).required(),
  category: Joi.string().trim().max(80).allow("", null),
  expenseDate: Joi.date().max("now").required(),
  notes: Joi.string().trim().max(1000).allow("", null),
});

const updateExpenseSchema = expenseSchema.fork(
  ["merchant", "amount", "expenseDate"],
  (field) => field.optional(),
).min(1);

expenseRouter.get("/", protect, validateExpenseQuery, listExpenses);
expenseRouter.post("/", protect, requireEmailVerified, auditRequest, validate(expenseSchema), createExpense);
expenseRouter.get("/:id", protect, requireOwnership({ Model: Expense }), getExpense);
expenseRouter.patch(
  "/:id",
  protect,
  requireEmailVerified,
  requireOwnership({ Model: Expense }),
  auditRequest,
  validate(updateExpenseSchema),
  updateExpense,
);
expenseRouter.delete("/:id", protect, requireOwnership({ Model: Expense }), auditRequest, deleteExpense);



module.exports = expenseRouter;
