# Phase 3 Final - Budget Page + Account Cleanup

This patch completes the Phase 3 budget UI integration against the current project.

## What changes

- Adds a dedicated `budget.html` page.
- Adds `public/css/budget.css` for all Budget page styling.
- Adds `public/js/budget.js` for Budget page behavior/API calls.
- Adds `/budget/rules` and `/budget/status` APIs.
- Keeps the backend BudgetRule/BudgetUsage enforcement as the authority.
- Migrates the old `User.monthlyBudget` value into `BudgetRule.monthlyLimitPaise` when a BudgetRule is first created, so existing users do not lose their old monthly budget.
- Removes the old My Account monthly-budget editor/card.
- Keeps My Account Quick Statistics.
- Removes the old budget-dependent medal/motivation card because it duplicated budget insight and depended on the removed legacy budget field.
- Adds Budget to the shared application navigation.
- Removes the old `/users/budget` route from the active API surface.
- Removes the fake virtual-wallet balance API/model from the active model registry/routes. The future `/wallet` area is reserved for payment/transaction functionality and must not represent stored money.
- Cleans inline CSS and inline JavaScript from HTML files in the current project. Styling is kept in CSS files and page behavior in JS files.

## Important

Do not replace `.env`.

The old `User.monthlyBudget` schema field is intentionally retained temporarily only for compatibility migration of existing records. New budget reads/writes use `BudgetRule`. The compatibility migration copies it into BudgetRule and clears the legacy User.monthlyBudget value for that user. The schema field can be removed in a later cleanup after migration is complete.

The `Wallet` model is no longer registered or exposed by the application. No real money is stored by this project.

## Expected navigation

Dashboard | Leaderboard | Reports | Budget

A future Wallet page can be added later for Cashfree/transaction functionality without confusing it with budget configuration.
