const env = require('./src/config/env')
const app = require("./app");
const connectDB = require("./src/config/db");
const PORT = env.port;

const startServer = async () => {
  try {
    // Database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running successfully on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error(`Server disconnected`, error.message);
    process.exitCode = 1;
  }
};

startServer();
