const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const apiRouter = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const app = express();

// Beacuse of hosting Render platform it's working proxy through
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // time period 15 mint
  max: 100,
  message: {
    status: 429,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api", apiLimiter, apiRouter);

app.get("/api/v1/health", (req, res) => {
  res.send("API Healthy...");
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(errorHandler)

module.exports = app;
