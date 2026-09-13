# Phase 3 - Budget Enforcement

This patch adds budget enforcement for the existing manual expense flow.

## What it implements

- Daily, weekly and monthly overall spending limits from `BudgetRule`.
- Daily, weekly and monthly category-specific limits.
- Canonical category validation; unexpected AI output falls back to `Other`.
- Integer paise calculations at the budget boundary while preserving the existing `Expense.amount` rupee field.
- `BudgetUsage` counters for current-period usage.
- One-time/lazy reconstruction of current-period usage from existing `Expense` documents, so old expenses are not ignored.
- MongoDB transaction covering budget usage + expense creation + `User.totalExpense` update.
- Atomic concurrency behavior through MongoDB transactional writes to the same usage documents.
- Expense deletion reverses budget usage in the same transaction.
- Current budget status endpoint: `GET /wallet/budget-status`.
- Clear `409 BUDGET_EXCEEDED` responses for frontend handling.
- Validation for invalid amounts and duplicate category+period rules.
- Indexes for budget-period reconstruction queries.

## Current scope

Phase 3 applies to expenses entered manually through `POST /expense/addexpense`.
Verified external transactions and automatic expense creation are Phase 4/5.

The existing `User.monthlyBudget` feature is intentionally not removed or silently
reinterpreted; the new enforcement uses the Phase 2 `BudgetRule` configuration.

## Optional environment variable

`APP_TIMEZONE` controls budget period boundaries. Default:

`Asia/Kolkata`

Example:

`APP_TIMEZONE=Asia/Kolkata`

## API

`GET /wallet/budget-status`

Returns configured rules plus current-period usage/remaining amounts.

When an expense would exceed a configured rule, the API returns HTTP 409:

```json
{
  "success": false,
  "code": "BUDGET_EXCEEDED",
  "message": "Expense would exceed your budget limit",
  "budget": {
    "period": "monthly",
    "category": "Food",
    "limitPaise": 500000,
    "spentPaise": 450000,
    "requestedPaise": 100000,
    "remainingPaise": 50000
  }
}
```

## Testing performed before delivery

- `node --check` on all changed JavaScript files.
- Period-key/boundary checks for Asia/Kolkata.
- Rupees-to-paise conversion checks, including decimal validation.

Do not overwrite `.env` when applying this patch.
