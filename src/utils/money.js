const MAX_MINOR_UNITS = 10000000000;

const toMinorUnits = (value) => {
  const text = String(value).trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new TypeError("Amount must have no more than two decimal places");
  const minorUnits = BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0"));
  if (minorUnits > BigInt(MAX_MINOR_UNITS)) {
    throw new RangeError("Amount is outside the supported range");
  }
  return Number(minorUnits);
};

const fromMinorUnits = (value) => Number(value) / 100;

const serializeMonetaryDocument = (document, minorField, publicField) => {
  const result = typeof document.toObject === "function" ? document.toObject() : { ...document };
  if (result[minorField] !== undefined) result[publicField] = fromMinorUnits(result[minorField]);
  delete result[minorField];
  delete result.idempotencyKey;
  delete result.__v;
  return result;
};

const serializeExpense = (expense) => serializeMonetaryDocument(expense, "amountMinor", "amount");
const serializeRecurringExpense = (expense) => serializeMonetaryDocument(expense, "amountMinor", "amount");

const serializeReceipt = (receipt) => {
  const result = typeof receipt.toObject === "function" ? receipt.toObject() : { ...receipt };
  if (result.extracted?.amountMinor !== undefined) {
    result.extracted.amount = fromMinorUnits(result.extracted.amountMinor);
    delete result.extracted.amountMinor;
  }
  delete result.__v;
  return result;
};

module.exports = {
  toMinorUnits,
  fromMinorUnits,
  MAX_MINOR_UNITS,
  serializeExpense,
  serializeRecurringExpense,
  serializeReceipt,
};