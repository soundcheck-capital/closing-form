# Closing Form

A React + TypeScript app for a generic Stripe Financial Connections flow (ACH) followed by a submission confirmation screen.

## Features

- Single `/form` flow focused on Stripe ACH connection
- Automatic submit after successful bank account connection
- Final confirmation screen at `/submit-success`
- No HubSpot deal/customer dependency in frontend

## Tech Stack

- React 19
- TypeScript
- Redux Toolkit
- React Router
- Tailwind CSS

## Installation

```bash
git clone <repository-url>
cd closing-form
npm ci
```

## Environment Variables

Create `.env` from `env.example` and set:

- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_STRIPE_FCA_WEBHOOK`
- `REACT_APP_CLOSING_FORM_SUBMIT_WEBHOOK`

## Run

```bash
npm start
```

App runs on `http://localhost:3001` (or next available port).

## Build

```bash
npm run build
```

## Routes

- `/` -> redirects to `/form`
- `/form` -> generic Stripe ACH form
- `/submit-success` -> confirmation screen

## Project Structure

```text
src/
├── components/
│   ├── ACHDirectDebitStep.tsx
│   ├── MultiStepForm.tsx
│   ├── SubmitSuccess.tsx
│   └── customComponents/
├── services/
│   └── stripeFCAService.ts
├── store/
└── utils/
```
