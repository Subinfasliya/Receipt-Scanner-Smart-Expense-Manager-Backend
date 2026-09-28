const authRouter = require('./authRouter')

const v1Router = require('express').Router()

v1Router.use("/auth", authRouter)

module.exports = v1Router