const connectDB = require("../src/config/db");
const { seedAdminUser } = require("../src/services/adminSeedService");

const runSeed = async () => {
  try {
    await connectDB();
    const result = await seedAdminUser();

    if (result.created) {
      console.log(`Admin seed created for ${result.user.email}`);
    } else if (result.updated) {
      console.log(`Admin role ensured for ${result.user.email}`);
    } else if (result.skipped) {
      console.log("Admin seed skipped because admin credentials were not configured.");
    } else {
      console.log(`Admin seed already exists for ${result.user.email}`);
    }
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  }
};

runSeed();
