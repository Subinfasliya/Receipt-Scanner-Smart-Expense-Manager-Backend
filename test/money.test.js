const test = require("node:test");
const assert = require("node:assert/strict");
const { toMinorUnits, fromMinorUnits, serializeExpense } = require("../src/utils/money");

test("money conversion stores decimal inputs as exact minor units", () => {
  assert.equal(toMinorUnits(12.34), 1234);
  assert.equal(toMinorUnits("0.10"), 10);
  assert.equal(toMinorUnits(100000000), 10000000000);
  assert.equal(fromMinorUnits(1234), 12.34);
});

test("money conversion rejects invalid precision and unsafe values", () => {
  assert.throws(() => toMinorUnits("1.005"), /two decimal places/);
  assert.throws(() => toMinorUnits("-1.00"), /two decimal places/);
  assert.throws(() => toMinorUnits("90071992547409.92"), /supported range/);
  assert.throws(() => toMinorUnits(100000000.01), /supported range/);
});

test("expense serialization preserves decimal API amounts without exposing minor fields", () => {
  const serialized = serializeExpense({
    _id: "expense-id",
    amountMinor: 1250,
    idempotencyKey: "private-key",
  });
  assert.equal(serialized.amount, 12.5);
  assert.equal("amountMinor" in serialized, false);
  assert.equal("idempotencyKey" in serialized, false);
});