# Closing Form

Generic Stripe ACH form for collecting basic customer info, connecting a bank account via Stripe Financial Connections, and submitting the session payload to a webhook.

## Current Scope

- Single route flow: `/form`
- Customer pre-form (full name, company name, email)
- Stripe Financial Connections bank account link
- Auto-submit to final webhook after successful connection
- Success route: `/submit-success`

## Tech Stack

- React 19 + TypeScript
- Redux Toolkit
- React Router
- Tailwind CSS

## Environment Variables

Create `.env` from `env.example`.

Required:

- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_STRIPE_FCA_WEBHOOK`
- `REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK`

## Local Development

```bash
npm ci
npm start
```

Default dev URL is `http://localhost:3001` (or next available port).

## Build

```bash
npm run build
```

## Test

```bash
npm test -- --watchAll=false
```

## Runtime Flow

1. User fills mini form (name, company, email)
2. "Connect Bank Account" button is enabled
3. App requests FCA session from `REACT_APP_STRIPE_FCA_WEBHOOK`
4. Stripe bank connection completes
5. App submits final payload to `REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK`

Final payload includes:

- `timestamp`
- `formData.ach.customerInfo`
- `formData.ach.stripeSessionData`
- `formData.ach.financialConnectionsAccountId`

## Routes

- `/` -> redirect to `/form`
- `/form` -> Stripe ACH flow
- `/submit-success` -> success screen

## Notes

- Legacy password/auth/DocuSign flow has been removed.
- Frontend is now generic and not tied to deal/customer env vars.
