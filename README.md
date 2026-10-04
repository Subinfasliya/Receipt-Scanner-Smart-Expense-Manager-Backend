# ScanSpend API

Express 5 and MongoDB backend for expenses, receipts, recurring transactions, and subscriptions. Authenticated resources are scoped to the signed-in user; missing and non-owned resource IDs return the same 404 response.

## Local Setup

1. Use Node.js 20 or later and MongoDB 6 or later.
2. Run `npm ci`.
3. Copy `.env.example` to `.env`, set MongoDB, SMTP, and two independent random token secrets. Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
4. Run `npm test` and `npm start`.
5. Health endpoint: `GET /api/v1/health`.

Receipt storage requires all three Cloudinary settings. OCR uses Tesseract.js English data, which must be downloadable by the server on first use. Razorpay checkout requires both API keys and a webhook secret; configure Razorpay to call `POST /api/v1/webhooks/razorpay` for `payment.captured` and `payment.failed`. AI-provider variables are optional; without them, insights are statistical and labeled accordingly. Never commit `.env` or provider credentials.

## API Surface

All paths are under `/api/v1`.

| Area | Endpoints |
| --- | --- |
| Expenses | `GET/POST /expenses`, `GET/PATCH/DELETE /expenses/:id` |
| Receipts | `GET/POST /receipts`, `GET/DELETE /receipts/:id`, `POST /receipts/:id/expense` |
| Budgets | `GET/PUT /budgets` |
| Recurring expenses | `GET/POST /recurring-expenses`, `PATCH/DELETE /recurring-expenses/:id` |
| Analytics | `GET /analytics/summary`, `GET /analytics/insights`, `GET /analytics/export` |
| Subscription | `GET /subscriptions`, `POST /subscriptions/checkout` |
| Webhooks | `POST /webhooks/razorpay` |
| Admin | `GET /admin/audit-logs` (admin role only) |

Use `Authorization: Bearer <access-token>` for protected routes. Receipt OCR, recurring expenses, analytics, insights, and exports require an active premium entitlement. Upload one JPEG, PNG, or WebP file in the `receipt` multipart field (maximum 5 MiB). Expenses support date-range filters and pagination; exports are CSV and neutralize spreadsheet formula cells.

## Security And Operations

- JWT secrets are required; production requires 32+ characters and rejects localhost CORS origins.
- Razorpay webhooks are verified against the exact raw request bytes, deduplicated by provider event ID, and checked against the expected order amount/currency before premium activation.
- Mutations write metadata-only audit events. Logs expire after one year; request bodies and payment payloads are not stored.
- Recurring expenses use a Mongo-backed, retryable job queue with deduplication keys. Run a single Render web instance unless the database and deployment are configured to support the worker's multi-instance operation.
- Set `ALLOWED_ORIGINS` to the exact frontend origins, configure Render's MongoDB network access, and use a managed MongoDB deployment with backups and TLS.
- `npm audit` should be run as part of release review. Rotate secrets immediately if they are exposed.

## Render

The included `render.yaml` defines the Node service, `npm ci` build, health check, and secret placeholders. Create the service from the Blueprint, then add the MongoDB URI, exact frontend origins, SMTP credentials, and any optional Cloudinary/Razorpay/AI credentials in Render's environment settings. Verify `GET /api/v1/health`, registration/email verification, expense ownership, receipt OCR, checkout, and webhook delivery against provider test environments before enabling live payments.

Do not treat a successful deployment as an end-to-end certification: live Cloudinary, OCR model download, SMTP, MongoDB networking, Razorpay test/live credentials, and Render networking require environment-specific verification.
