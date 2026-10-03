const env = require('./env')

const mongoose = require("mongoose");

const connectDB = async () => {
  if (!env.mongoUri) {
    console.error("CRITICAL ERROR: MONGODB_URI is not defined in env files.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
    });

    console.log(`MongoDB Connected Safely: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
