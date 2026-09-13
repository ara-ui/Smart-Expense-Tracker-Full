# Smart Expense Tracker - Payment Foundation + Phase 2 Patch

This patch is based on the uploaded current project.

## What is included

- Provider-agnostic payment service layer.
- Cashfree provider adapter.
- Production-safe Cashfree popup/redirect return handling.
- Server-side payment verification.
- Tri-state payment handling (SUCCESS/PENDING/FAILED).
- PROCESSING lease to prevent concurrent double application, with stale-lock recovery.
- Atomic MongoDB transaction for successful payment + business effect.
- Cashfree webhook signature verification.
- Generic Order fields for provider/purpose/amount.
- Random opaque payment order IDs.
- Existing Phase 2 Wallet/BudgetRule files are not changed by this patch.
- `.env.example` documenting required payment settings.

## Cashfree flow

Popup:
Create order -> Cashfree popup -> browser result -> authenticated server verification -> atomic business effect.

Fallback:
Cashfree redirect -> `/purchase/return/cashfree` -> `premium-required.html?order_id=...` -> authenticated verification -> atomic business effect.

Webhook:
Cashfree -> signed webhook -> signature verification -> provider status reconciliation -> same idempotent payment service.

The browser never marks a payment successful or failed on its own.

## Required environment variables

APP_URL must be the public HTTPS URL in production, for example:
https://your-domain.example

CASHFREE_ENVIRONMENT=sandbox during testing, production when live.
CASHFREE_APP_ID and CASHFREE_SECRET_KEY must match that environment.

Do not commit `.env`.

## Important production note

The current project does not collect a phone number on User. A temporary Cashfree fallback phone is supported for compatibility, but production should add real customer phone collection and validation before going live.

## Future UPI / providers

UPI through Cashfree is handled by the Cashfree checkout/payment methods; a separate UPI provider is not required if Cashfree is the chosen gateway and UPI is enabled for the merchant.

A different payment provider can be added under:
services/payments/providers/

without putting provider SDK calls into controllers or expense/wallet logic.

## Not included

This patch does not implement the later budget-enforcement, transaction-ledger, automatic-expense, AI fallback, or audit-log phases. Those should be built on top of this payment foundation rather than mixed into the payment provider.
