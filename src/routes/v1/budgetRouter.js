const Joi = require("joi");
const { getBudgets, upsertBudget } = require("../../controllers/budgetController");
const protect = require("../../middlewares/auth/authMiddleware");
const auditRequest = require("../../middlewares/auditRequest");
const validate = require("../../middlewares/validate");

const budgetRouter = require("express").Router();
const budgetSchema = Joi.object({
  category: Joi.string().trim().min(1).max(80).required(),
  year: Joi.number().integer().min(2000).max(2200),
  month: Joi.number().integer().min(1).max(12),
  limit: Joi.number().positive().max(100000000).precision(2).required(),
});

budgetRouter.get("/", protect, getBudgets);
budgetRouter.put("/", protect, auditRequest, validate(budgetSchema), upsertBudget);

module.exports = budgetRouter;