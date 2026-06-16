# Closing Form: Next.js Migration

## Context

The closing form is a React CRA app deployed on Netlify that lets customers connect their bank account via Stripe Financial Connections. Backend logic currently lives in 3 Make.com webhook scenarios. This migration brings the backend in-house as Next.js API routes, removes obsolete features (password protection), and adds Slack notifications + Sentry observability.

## Architecture

Next.js App Router deployed on Netlify via `@netlify/plugin-nextjs`. Single-page app with server-side API routes.

### Pages

| Route | Description |
|-------|-------------|
| `/form` | Customer info form + Stripe Financial Connections flow |
| `/form?companyName=X` | Same page, companyName field pre-filled |

No other pages. No login, no password protection.

### API Routes

#### `POST /api/create-fca`

Replaces Make.com scenario "API /createFCA" (ID: 4785264).

**Input:**
```json
{ "fullName": "string", "companyName": "string", "email": "string" }
```

**Backend logic (using Stripe Node SDK):**
1. `stripe.customers.create({ name: fullName, email, description: companyName })`
2. `stripe.setupIntents.create({ customer: customerId, payment_method_types: ['us_bank_account'], payment_method_options: { us_bank_account: { verification_method: 'instant' } } })`
3. `stripe.financialConnections.sessions.create({ account_holder: { type: 'customer', customer: customerId }, permissions: ['payment_method', 'balances', 'ownership', 'transactions'], prefetch: ['balances'] })`

**Output:**
```json
{ "id": "fcsess_xxx", "client_secret": "fcsess_client_secret_xxx", "customerId": "cus_xxx", "setupIntentId": "seti_xxx" }
```

#### `POST /api/confirm-and-notify`

Called after successful bank connection on the client side.

**Input:**
```json
{
  "customerId": "cus_xxx",
  "setupIntentId": "seti_xxx",
  "financialConnectionsAccountId": "fca_xxx",
  "customerInfo": { "fullName": "string", "companyName": "string", "email": "string" }
}
```

**Backend logic:**
1. Confirm the SetupIntent (attach payment method from FCA account)
2. Send Slack notification to #origination-closing (C09H2RMPR9P):
   - Company name, customer email
   - Link to Stripe customer dashboard
   - Confirmation that bank connection succeeded

**Output:**
```json
{ "success": true }
```

### Environment Variables

```
# Server-side only
STRIPE_SECRET_KEY=sk_test_xxx
SLACK_BOT_TOKEN=xoxb-xxx
SLACK_CHANNEL_ID=C09H2RMPR9P
SENTRY_DSN=https://xxx@sentry.io/xxx

# Client-side (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### What Gets Removed

- Password protection: `PasswordProtection.tsx`, `ProtectedRoute.tsx`, localStorage auth check
- Make.com webhooks: `REACT_APP_STRIPE_FCA_WEBHOOK`, `REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK`, `REACT_APP_CHECK_PASSWORD_CUSTOMER_LINK_WEBHOOK`
- Redux store (overkill for local form state)
- `react-router-dom` (single page)
- `stripeFCAService.ts` (replaced by fetch to `/api/create-fca`)
- `statusCache.ts`, `ValidationContext.tsx` (unused in simplified flow)
- `REACT_APP_*` env vars (Next.js uses `NEXT_PUBLIC_*`)

### What Gets Kept

- Tailwind CSS styling and all existing UI components/layout
- Customer info form (fullName, companyName, email) with validation
- Stripe.js client-side integration (`@stripe/stripe-js` replaces script tag loading)
- Stripe Financial Connections client flow (`collectFinancialConnectionsAccounts`)
- companyName URL query parameter (cleaned up to use Next.js `searchParams`)
- All SVG assets and branding
- Playwright E2E test structure (updated for new routes)

### Client-Side Flow

1. User lands on `/form` (optionally with `?companyName=X`)
2. Fills in fullName, companyName (pre-filled if in URL), email
3. Clicks "Connect Bank Account"
4. Client calls `POST /api/create-fca` with customer info
5. Client receives FC session `client_secret`
6. Client opens Stripe FC modal via `stripe.collectFinancialConnectionsAccounts({ clientSecret })`
7. User connects bank account in Stripe modal
8. On success, client calls `POST /api/confirm-and-notify` with IDs
9. Server confirms SetupIntent + sends Slack notification
10. Client shows success state

### Tech Stack

- **Framework:** Next.js (App Router)
- **Deployment:** Netlify (`@netlify/plugin-nextjs`)
- **Styling:** Tailwind CSS
- **Stripe server:** `stripe` Node SDK
- **Stripe client:** `@stripe/stripe-js`
- **Slack:** `@slack/web-api`
- **Observability:** `@sentry/nextjs`
- **E2E:** Playwright

### E2E Testing Strategy

- Playwright tests mock Stripe.js (same approach as current tests)
- Mock the API routes for unit isolation
- Full sandbox test: form fill -> FCA mock -> success state
- Tests run on Netlify deploy previews
- No password flow to test (removed)

### companyName Query Parameter Cleanup

Current: `getCompanyNameFromUrl()` reads from `window.location.search` manually.
New: Next.js page component receives `searchParams` prop directly. No manual URL parsing needed. The `companyName` param is read once and passed as initial value to the form.
