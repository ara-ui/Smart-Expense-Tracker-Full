# Phase 3 Finalization — Budget Security, Insights & Account Stats

Apply this patch to the CURRENT project state that already contains the Phase 3 Budget page.

## Included
- Dedicated Budget page remains the source of budget configuration.
- My Account remains summary-only; no monthly budget section is added.
- Fixed GET /users/stats so Quick Statistics loads correctly using the same timezone-aware period boundaries as the budget system.
- Overall budget editing is read-only after save; "Edit limits" enables modification.
- Password re-authentication is required by the BACKEND before overall or category budget changes/removals.
- Re-authentication token is signed, scoped to the user and BUDGET_EDIT purpose, and expires after 15 minutes.
- Existing forgot-password page is linked from the verification modal.
- Spending Insights endpoint compares current and previous month and highlights on-track/near-limit/exceeded states and top categories.
- Budget changes create lightweight audit records in BudgetAuditLog.
- HTML/CSS/JS remain separated.

## Files
- utils/jwt.js
- controller/password.js
- routes/password.js
- middleware/budgetReauth.js
- routes/budgetRoutes.js
- controller/userController.js
- controller/budgetController.js
- model/BudgetAuditLog.js
- model/index.js
- public/budget.html
- public/css/budget.css
- public/js/budget.js

## Important
Do not replace `.env`.

Restart with:
node app.js

## Expected tests
1. Account -> Quick Statistics loads real values.
2. Budget -> saved overall limits become read-only and show "Edit limits".
3. Click Edit limits -> password modal appears.
4. Correct password -> fields become editable.
5. Wrong password -> backend rejects.
6. "Forgot password?" opens the existing forgot-password flow.
7. Category add/update/remove also requires password verification.
8. Re-auth token expires after 15 minutes.
9. Budget Insights displays recent spending pattern.
10. Over-budget expense remains rejected by the existing Phase 3 budget engine.

This patch does not implement real-money wallet storage. The future payment Wallet remains Cashfree/payment-transaction based.
