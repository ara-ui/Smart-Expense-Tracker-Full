# Phase 5 — Payments UI + Automatic Expense Flow

## Implemented

- Added a dedicated Premium-only Payments area, opened from the header payment icon beside notifications.
- Free users can see the payment icon but are redirected to the existing Premium Required page, where the Premium upgrade purchase remains accessible.
- Budget, Reports, and Leaderboard navigation/API access are Premium-gated. Premium purchase remains accessible to Free users.
- Added quick payment form with only amount + remark.
- Added compact recent payment history and a full history page.
- Added payment details page with payment method, remark, date, provider transaction ID, order ID, provider, status, and linked expense state.
- Added `EXPENSE_PAYMENT` purpose to orders and transactions.
- Cashfree order creation now accepts the dynamic amount and stores the remark on the order.
- Successful verified `EXPENSE_PAYMENT` transactions automatically create an Expense, update BudgetUsage, and update `User.totalExpense` in the same MongoDB transaction.
- Existing manual expense flow remains unchanged.
- Payment history is backed by the existing Transaction collection; no separate duplicate payment table was introduced.

## Access model

Free:
- Core dashboard/expense/account functionality.
- Premium upgrade purchase.
- Budget, Reports, Leaderboard, Payments: Premium required.

Premium:
- All features, including Payments.

## Important payment behavior

The Payments page is a fast Cashfree checkout for the application's configured Cashfree merchant account. The user-entered remark is stored as the payment context and is also used as the automatically-created expense description. The category is determined from the remark using the existing category service with an `Other` fallback.

The app does not implement peer-to-peer UPI transfers or store money in a wallet.

## Testing performed in this patch

- All modified JavaScript files pass `node --check` syntax validation.
- Full Cashfree integration testing still needs to be run after applying this patch: Premium user creates an expense payment, completes Sandbox checkout, verifies one successful Transaction + one Expense + BudgetUsage update, then tests duplicate webhook delivery and failed/pending cases.

Do not commit this phase until those integration tests pass.
