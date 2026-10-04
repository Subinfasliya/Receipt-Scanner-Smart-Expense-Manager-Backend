const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Expense = require("../src/models/expenseModel");
const Budget = require("../src/models/budgetModel");
const RecurringExpense = require("../src/models/recurringExpenseModel");
const Receipt = require("../src/models/receiptModel");

const migrateField = (Model, oldField, newField) => Model.collection.updateMany(
  { [oldField]: { $type: "number" }, [newField]: { $exists: false } },
  [
    { $set: { [newField]: { $round: [{ $multiply: [`$${oldField}`, 100] }, 0] } } },
    { $unset: oldField },
  ],
);

const migrateReceiptAmounts = () => Receipt.collection.updateMany(
  {
    "extracted.amount": { $type: "number" },
    "extracted.amountMinor": { $exists: false },
  },
  [
    {
      $set: {
        "extracted.amountMinor": {
          $round: [{ $multiply: ["$extracted.amount", 100] }, 0],
        },
      },
    },
    { $unset: "extracted.amount" },
  ],
);

const assertSupportedRange = async (Model, field) => {
  const invalidCount = await Model.collection.countDocuments({
    [field]: { $type: "number", $gt: 100000000 },
  });
  if (invalidCount > 0) {
    throw new Error(`${Model.collection.collectionName}.${field} contains ${invalidCount} values above the supported maximum`);
  }
};

const run = async () => {
  await connectDB();
  try {
    await Promise.all([
      assertSupportedRange(Expense, "amount"),
      assertSupportedRange(Budget, "limit"),
      assertSupportedRange(RecurringExpense, "amount"),
      assertSupportedRange(Receipt, "extracted.amount"),
    ]);
    const results = await Promise.all([
      migrateField(Expense, "amount", "amountMinor"),
      migrateField(Budget, "limit", "limitMinor"),
      migrateField(RecurringExpense, "amount", "amountMinor"),
      migrateReceiptAmounts(),
    ]);
    console.log("Money migration complete", {
      expenses: results[0].modifiedCount,
      budgets: results[1].modifiedCount,
      recurringExpenses: results[2].modifiedCount,
      receipts: results[3].modifiedCount,
    });
  } finally {
    await mongoose.connection.close();
  }
};

run().catch((error) => {
  console.error("Money migration failed", { name: error.name });
  process.exitCode = 1;
});