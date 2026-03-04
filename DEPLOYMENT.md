# Deployment

## Build Command

```bash
npm run build
```

## Publish Directory

`build`

## Required Environment Variables

- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_STRIPE_FCA_WEBHOOK`
- `REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK`

## Notes

- App is a SPA; ensure platform rewrites all routes to `index.html`.
- The app exposes routes `/form` and `/submit-success`.
