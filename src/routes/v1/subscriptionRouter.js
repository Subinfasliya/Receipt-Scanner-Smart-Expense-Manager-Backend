const Joi = require("joi");
const { startCheckout, getSubscription } = require("../../controllers/subscriptionController");
const protect = require("../../middlewares/auth/authMiddleware");
const auditRequest = require("../../middlewares/auditRequest");
const validate = require("../../middlewares/validate");

const subscriptionRouter = require("express").Router();
const checkoutSchema = Joi.object({ plan: Joi.string().valid("monthly", "annual").required() });

subscriptionRouter.get("/", protect, getSubscription);
subscriptionRouter.post("/checkout", protect, auditRequest, validate(checkoutSchema), startCheckout);

module.exports = subscriptionRouter;