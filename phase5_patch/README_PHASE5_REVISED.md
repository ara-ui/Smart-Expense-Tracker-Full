# Phase 5 Revised — Cashfree UPI/QR Payment + Idempotency + Return Fix

This patch is built against the uploaded current `smart-expense-tracker-full(6).zip`.

## What changed

- Cashfree checkout return URL is derived from the browser's current allowed origin, preventing localhost/ngrok origin mismatch.
- `payment-status.html` can reliably receive `order_id` from Cashfree and verify it server-side.
- Added local payment-order idempotency using `Idempotency-Key` scoped to the authenticated user and payment purpose.
- Added Cashfree request idempotency using the local order ID as the provider idempotency key.
- Added atomic webhook-event claiming so duplicate/concurrent webhooks cannot process the same event simultaneously.
- Failed/stale webhook events can be retried safely.
- Cashfree order amount and currency are checked against the local order before accepting success.
- Successful Cashfree payment amount is also checked against the local order.
- Payment-status Back button now correctly returns to Payments for expense payments or Dashboard for premium upgrades.
- Premium purchase keeps its existing flow and now also uses idempotency.

## Security/idempotency retained

- Server-side Cashfree verification remains authoritative.
- Cashfree webhook signature verification remains enabled.
- Order ownership checks remain in the authenticated browser verification path.
- Order state transition remains atomic with the business effect in the MongoDB transaction.
- Transaction uniqueness remains enforced by `(provider, orderId)` and provider transaction ID.
- Automatic expense creation remains linked to the verified transaction and protected by the existing MongoDB transaction/budget enforcement.
- Payment API remains rate-limited and Premium-only for expense payments.

## Important development setup

For the cleanest local test, open the application from the same origin you want Cashfree to return to. If using ngrok, open the app itself using the ngrok HTTPS URL and create the payment from that URL. The backend still uses `APP_URL` for the Cashfree webhook `notify_url`.

Do not copy `.env` from a patch. Keep your existing secrets local.
