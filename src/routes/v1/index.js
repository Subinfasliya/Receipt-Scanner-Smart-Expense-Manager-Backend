const adminRouter = require("./adminRouter");
const authRouter = require("./authRouter");
const healthRouter = require("./healthRouter");

const v1Router = require("express").Router();

v1Router.use("/auth", authRouter);
v1Router.use("/health", healthRouter);
v1Router.use("/admin", adminRouter);

module.exports = v1Router;
