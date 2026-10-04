const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const requirePremium = require("../src/middlewares/auth/requirePremium");
const { signatureIsValid } = require("../src/utils/webhookSignature");
const { advanceDate } = require("../src/services/jobService");

test("Razorpay webhook signature validates exact raw bytes", () => {
  const rawBody = Buffer.from('{"event":"payment.captured"}');
  const secret = "test-webhook-secret";
  const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  assert.equal(signatureIsValid(rawBody, signature, secret), true);
  assert.equal(signatureIsValid(Buffer.from("altered"), signature, secret), false);
  assert.equal(signatureIsValid(rawBody, signature, "wrong-secret"), false);
});

test("premium authorization rejects expired entitlements", () => {
  let forwardedError;
  requirePremium(
    { user: { isPremium: true, premiumExpiresAt: new Date(Date.now() - 1000) } },
    {},
    (error) => { forwardedError = error; },
  );
  assert.equal(forwardedError.statusCode, 403);
});

test("monthly recurring dates clamp to the last day of short months", () => {
  const next = advanceDate(new Date("2026-01-31T12:00:00.000Z"), "monthly");
  assert.equal(next.toISOString(), "2026-02-28T12:00:00.000Z");
});