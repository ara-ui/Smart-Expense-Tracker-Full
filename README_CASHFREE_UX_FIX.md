# Cashfree checkout UX fix

This patch is for the project state that already contains the provider-agnostic payment architecture and Phase 2 wallet/budget code.

## What it fixes

The previous flow used Cashfree popup mode (`redirectTarget: "_modal"`) plus a 90-second timeout. In the real Sandbox test the payment succeeded, but the SDK result timed out and the application eventually opened the dashboard from the payment window.

This patch changes the normal browser flow to Cashfree's current-tab redirect checkout (`redirectTarget: "_self"`) and returns to a dedicated `payment-status.html` page. Cashfree's Create Order return URL is changed to that page. The page then calls the authenticated backend verification endpoint, shows Success/Failed/Pending, stores the fresh premium JWT on success, and redirects the main tab to `expense.html`.

The server remains authoritative for payment status. No client-side payment result is trusted.

## Files

- `services/payments/providers/cashfreeProvider.js` — return URL now targets `payment-status.html`.
- `public/js/modules/premium.js` — removes the popup timeout path and uses `_self` redirect checkout.
- `public/payment-status.html` — new payment result page.
- `public/js/payment-status.js` — authenticated verification/polling and final redirect.
- `routes/purchaseRoutes.js` — removes the now-unused Cashfree browser return route.

## Environment

Keep your existing `.env`. It must contain:

`APP_URL=http://localhost:3000`

for local testing. Use the real HTTPS application URL in production.

Do not replace `.env` with a patch file.

## Expected flow

Upgrade -> Cashfree hosted checkout -> Sandbox payment -> payment-status.html -> server verification -> Success/Failed/Pending -> fresh premium JWT on success -> expense.html.
