const test = require("node:test");
const assert = require("node:assert/strict");
const BackgroundJob = require("../src/models/backgroundJobModel");
const { startJobWorker } = require("../src/services/jobService");

test("job worker contains transient polling errors", async () => {
  const originalFindOneAndUpdate = BackgroundJob.findOneAndUpdate;
  const originalConsoleError = console.error;
  let loggedErrors = 0;
  BackgroundJob.findOneAndUpdate = async () => {
    throw new Error("temporary database outage");
  };
  console.error = () => {
    loggedErrors += 1;
  };

  try {
    const stopWorker = startJobWorker();
    stopWorker();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(loggedErrors, 1);
  } finally {
    BackgroundJob.findOneAndUpdate = originalFindOneAndUpdate;
    console.error = originalConsoleError;
  }
});