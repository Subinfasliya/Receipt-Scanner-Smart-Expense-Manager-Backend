const { getHealthStatus } = require("../../controllers/healthController")

const healthRouter = require("express").Router()

healthRouter.get("/", getHealthStatus)

module.exports = healthRouter