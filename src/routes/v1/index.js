const adminRouter = require("./adminRouter");
const authRouter = require("./authRouter");
const expenseRouter = require("./expenseRouter");
const healthRouter = require("./healthRouter");
const receiptRouter = require("./receiptRouter");
const budgetRouter = require("./budgetRouter");
const recurringExpenseRouter = require("./recurringExpenseRouter");
const analyticsRouter = require("./analyticsRouter");
const subscriptionRouter = require("./subscriptionRouter");
const webhookRouter = require("./webhookRouter");

const v1Router = require("express").Router();

v1Router.use("/auth", authRouter);
v1Router.use("/health", healthRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/expenses", expenseRouter)
v1Router.use("/receipts", receiptRouter);
v1Router.use("/budgets", budgetRouter);
v1Router.use("/recurring-expenses", recurringExpenseRouter);
v1Router.use("/analytics", analyticsRouter);
v1Router.use("/subscriptions", subscriptionRouter);
v1Router.use("/webhooks", webhookRouter);

module.exports = v1Router;
