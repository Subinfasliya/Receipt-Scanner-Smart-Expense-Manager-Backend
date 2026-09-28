const mongoose = require("mongoose");
const env = require("../config/env");
const { version } = require("../../package.json");

/**
 * Maps Mongoose readyState numbers to human-readable strings
 */
const getDbStatus = () => {
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || "Unknown",
    isConnected: stateCode === 1,
  };
};


const getHealthStatus = (req, res) => {
  const dbStatus = getDbStatus();

  // Determine overall API health: Healthy if DB is connected
  const isHealthy = dbStatus.isConnected;
  const statusCode = isHealthy ? 200 : 503; // 503 Service Unavailable if DB drops

  res.status(statusCode).json({
    status: isHealthy ? "success" : "error",
    api: isHealthy ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version,
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
    },
    uptime: `${Math.floor(process.uptime())}s`,
  });
};

module.exports = { getHealthStatus };