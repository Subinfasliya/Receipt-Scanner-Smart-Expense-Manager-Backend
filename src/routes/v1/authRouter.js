const { register } = require("../../controllers/authController");
const validate = require("../../middlewares/validate");
const {
  registerSchema,
} = require("../../middlewares/validations/authValidation");

const authRouter = require("express").Router();

authRouter.post("/register", validate(registerSchema), register);

module.exports = authRouter;
