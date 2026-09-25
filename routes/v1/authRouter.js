const { register } = require('../../controllers/authController')

const authRouter = require('express').Router()

authRouter.post("/register", register)

module.exports = authRouter