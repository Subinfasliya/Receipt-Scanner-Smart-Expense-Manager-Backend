const bcrypt = require("bcryptjs");

const SALT_ROUND = 12;

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUND);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
