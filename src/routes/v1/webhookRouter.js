const { razorpayWebhook } = require("../../controllers/webhookController");

const webhookRouter = require("express").Router();
webhookRouter.post("/razorpay", razorpayWebhook);

module.exports = webhookRouter;