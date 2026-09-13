# Phase 4 — Transactions + Cashfree Webhooks

This phase adds the internal transaction ledger and a durable Cashfree webhook/idempotency layer.

## Added
- `Transaction` model: one internal transaction per provider order.
- `WebhookEvent` model: records verified Cashfree webhook events and processing state.
- `transactionService`: upserts transaction state without creating duplicate records.
- `webhookService`: verifies Cashfree signatures, derives a deterministic event key, records the event, and reconciles provider state through the existing server-side verification flow.
- Successful transaction finalization and the existing Premium membership effect run in the same MongoDB transaction.

## Idempotency
There are two layers:
1. `WebhookEvent` has a unique `(provider, eventKey)` key so the same webhook event is not processed repeatedly.
2. `Transaction` has a unique `(provider, orderId)` key, while the payment service still uses the atomic Order `PROCESSING -> SUCCESSFUL` transition to prevent duplicate business effects under concurrent browser/webhook verification.

## Trust model
Cashfree webhook signatures are verified using the raw request body, timestamp, and secret. After signature verification, the webhook is treated as a reconciliation trigger; the Cashfree server API remains authoritative for payment state.

## Scope boundary
Phase 4 does not automatically create Expenses from successful transactions yet. That is Phase 5. Premium membership payments are recorded as transactions but are not treated as user spending expenses.

## Testing
- Syntax-check all changed JavaScript files.
- Boot the Express application.
- Complete a Cashfree sandbox Premium payment and verify a Transaction document is created once.
- Verify repeated webhook delivery does not create another Transaction or apply Premium twice.
