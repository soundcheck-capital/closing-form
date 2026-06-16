# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the closing form from CRA to Next.js App Router, bring Stripe FCA + confirm backend in-house as API routes, add Slack notifications, remove password protection, add Sentry observability, and run E2E tests on Netlify.

**Architecture:** Next.js App Router with two API routes (`/api/create-fca` and `/api/confirm-and-notify`) that replace Make.com webhooks. Single `/form` page with client-side Stripe Financial Connections. Deployed on Netlify with `@netlify/plugin-nextjs`.

**Tech Stack:** Next.js, Tailwind CSS, `stripe` (server SDK), `@stripe/stripe-js` (client), `@slack/web-api`, `@sentry/nextjs`, Playwright

---

## File Structure

```
app/
  layout.tsx              — Root layout (html, body, fonts, Sentry)
  form/
    page.tsx              — Server component: reads searchParams, renders FormPage
    FormPage.tsx          — Client component: full form + Stripe FC flow (migrated from MultiStepForm + ACHDirectDebitStep)
  api/
    create-fca/
      route.ts            — POST handler: Stripe customer + SetupIntent + FC session
    confirm-and-notify/
      route.ts            — POST handler: confirm SetupIntent + Slack notification
lib/
  stripe.ts               — Stripe server client singleton
  slack.ts                — Slack client singleton
public/
  favicon.ico             — Kept from current
  logo_side_black.svg     — Moved from src/assets/
  logo_white_bold.svg     — Moved from src/assets/
  background.jpeg         — Moved from src/assets/
e2e/
  closing-flow.spec.ts    — Full E2E test (replaces password-flow.spec.ts)
tailwind.config.ts        — Tailwind config with custom animations
next.config.ts            — Next.js config
netlify.toml              — Netlify deployment config (updated for Next.js)
sentry.client.config.ts   — Sentry client init
sentry.server.config.ts   — Sentry server init
.env.example              — Updated env var template
playwright.config.ts      — Updated for Next.js dev server
```

**Files to delete after migration:**
- `src/` (entire directory)
- `public/index.html`, `public/404.html`, `public/_redirects`, `public/manifest.json`, `public/robots.txt`
- `build/` (entire directory)

---

## Task 1: Scaffold Next.js project alongside existing CRA

**Files:**
- Create: `package.json` (update in place — swap dependencies)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json` (replace CRA version)
- Create: `app/layout.tsx`
- Create: `app/form/page.tsx` (minimal placeholder)
- Modify: `netlify.toml`
- Modify: `.gitignore`
- Modify: `.env` (rename vars)

- [ ] **Step 1: Remove CRA dependencies and add Next.js dependencies**

Replace `package.json` entirely:

```json
{
  "name": "closing-form",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "test:e2e": "playwright test",
    "lint": "next lint"
  },
  "dependencies": {
    "@sentry/nextjs": "^9",
    "@slack/web-api": "^7",
    "@stripe/stripe-js": "^7",
    "next": "^15",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "stripe": "^18"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "@types/node": "^22",
    "@types/react": "^19.1.9",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'soundcheck-capital',
  project: 'closing-form',
  silent: !process.env.CI,
});
```

- [ ] **Step 3: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.5s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    tailwindcss: {},
  },
};
export default config;
```

- [ ] **Step 5: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'Noto Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 7: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Closing Form',
  description: 'SoundCheck Capital — Bank Account Connection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder `app/form/page.tsx`**

```tsx
export default function FormPage() {
  return <div>Form placeholder</div>;
}
```

- [ ] **Step 9: Move assets from `src/assets/` to `public/`**

```bash
cp src/assets/logo_side_black.svg public/logo_side_black.svg
cp src/assets/logo_white_bold.svg public/logo_white_bold.svg
cp src/assets/background.jpeg public/background.jpeg
```

- [ ] **Step 10: Update `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 11: Update `.gitignore`**

Add to `.gitignore`:
```
.next/
out/
```

Remove the `build/` directory entry if present (no longer needed).

- [ ] **Step 12: Create `.env.example`**

```
# Server-side only
STRIPE_SECRET_KEY=sk_test_xxxxx
SLACK_BOT_TOKEN=xoxb-xxxxx
SLACK_CHANNEL_ID=C09H2RMPR9P
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Client-side (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Playwright E2E
PLAYWRIGHT_TEST_COMPANY_NAME=soundcheckcapital.com
```

- [ ] **Step 13: Create Sentry config files**

`sentry.client.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

`sentry.server.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

- [ ] **Step 14: Install dependencies and verify build**

```bash
rm -rf node_modules package-lock.json
npm install
npx next build
```

Expected: Build succeeds with the placeholder page.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js App Router project replacing CRA"
```

---

## Task 2: Create Stripe and Slack server libraries

**Files:**
- Create: `lib/stripe.ts`
- Create: `lib/slack.ts`

- [ ] **Step 1: Create `lib/stripe.ts`**

```ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

- [ ] **Step 2: Create `lib/slack.ts`**

```ts
import { WebClient } from '@slack/web-api';

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN is not set');
}

export const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C09H2RMPR9P';
```

- [ ] **Step 3: Commit**

```bash
git add lib/stripe.ts lib/slack.ts
git commit -m "feat: add Stripe and Slack server client singletons"
```

---

## Task 3: Implement `/api/create-fca` route

**Files:**
- Create: `app/api/create-fca/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, companyName, email } = body;

    if (!fullName || !companyName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, companyName, email' },
        { status: 400 }
      );
    }

    const customer = await stripe.customers.create({
      name: fullName,
      email,
      description: companyName,
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          verification_method: 'instant',
        },
      },
    });

    const fcSession = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'customer',
        customer: customer.id,
      },
      permissions: ['payment_method', 'balances', 'ownership', 'transactions'],
      prefetch: ['balances'],
    });

    return NextResponse.json({
      id: fcSession.id,
      client_secret: fcSession.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx next build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/api/create-fca/route.ts
git commit -m "feat: add /api/create-fca route (Stripe customer + SetupIntent + FC session)"
```

---

## Task 4: Implement `/api/confirm-and-notify` route

**Files:**
- Create: `app/api/confirm-and-notify/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { slack, SLACK_CHANNEL_ID } from '@/lib/slack';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, setupIntentId, financialConnectionsAccountId, customerInfo } = body;

    if (!customerId || !setupIntentId || !financialConnectionsAccountId || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Retrieve the SetupIntent to check its current state
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    // If not yet confirmed, confirm it
    if (setupIntent.status === 'requires_payment_method' || setupIntent.status === 'requires_confirmation') {
      // List payment methods for the customer to find the one linked to the FCA account
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'us_bank_account',
      });

      if (paymentMethods.data.length > 0) {
        await stripe.setupIntents.confirm(setupIntentId, {
          payment_method: paymentMethods.data[0].id,
        });
      }
    }

    // Send Slack notification
    const stripeCustomerUrl = `https://dashboard.stripe.com/customers/${customerId}`;
    const slackMessage =
      `🏦 Bank account connected!\n` +
      `*Company:* ${customerInfo.companyName}\n` +
      `*Contact:* ${customerInfo.fullName} (${customerInfo.email})\n` +
      `*Stripe Customer:* <${stripeCustomerUrl}|${customerId}>\n` +
      `*FCA Account:* ${financialConnectionsAccountId}`;

    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: slackMessage,
      mrkdwn: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx next build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/api/confirm-and-notify/route.ts
git commit -m "feat: add /api/confirm-and-notify route (SetupIntent confirm + Slack notification)"
```

---

## Task 5: Build the form page (client component)

**Files:**
- Create: `app/form/FormPage.tsx`
- Modify: `app/form/page.tsx`

This is the biggest task. It migrates `MultiStepForm.tsx` and `ACHDirectDebitStep.tsx` into one client component that uses `@stripe/stripe-js` instead of a script tag, and calls the new API routes instead of Make.com webhooks.

- [ ] **Step 1: Create `app/form/FormPage.tsx`**

```tsx
'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

type CustomerInfo = {
  fullName: string;
  companyName: string;
  email: string;
};

type ConnectionState =
  | { status: 'idle' }
  | { status: 'loading-stripe' }
  | { status: 'ready' }
  | { status: 'connecting' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function FormPage({ initialCompanyName }: { initialCompanyName: string }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    companyName: initialCompanyName,
    email: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    companyName: false,
    email: false,
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'idle' });
  const [snackMessage, setSnackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = {
    fullName: customerInfo.fullName.trim().length < 2 ? 'Please enter a valid full name.' : '',
    companyName: customerInfo.companyName.trim().length < 2 ? 'Please enter a valid company name.' : '',
    email: emailPattern.test(customerInfo.email.trim()) ? '' : 'Please enter a valid email address.',
  };
  const isValid = !errors.fullName && !errors.companyName && !errors.email;

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CustomerInfo) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const showSnack = useCallback((type: 'success' | 'error', message: string) => {
    setSnackMessage({ type, message });
    setTimeout(() => setSnackMessage(null), type === 'success' ? 3000 : 5000);
  }, []);

  const startFinancialConnections = async () => {
    setConnectionState({ status: 'connecting' });

    try {
      // 1. Call our API to create Stripe customer + FC session
      const createRes = await fetch('/api/create-fca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerInfo),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create FCA session');
      }

      const { client_secret, customerId, setupIntentId } = await createRes.json();

      // 2. Open Stripe Financial Connections modal
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const result = await stripe.collectFinancialConnectionsAccounts({ clientSecret: client_secret });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const session = result.financialConnectionsSession;
      const accounts = session?.accounts?.data || session?.accounts || [];

      if (!Array.isArray(accounts) || accounts.length === 0) {
        setConnectionState({ status: 'error', message: 'Connection cancelled. Please click "Connect Bank Account" to try again.' });
        return;
      }

      const fcaId = accounts[0]?.id || accounts[0];
      if (!fcaId || !fcaId.toString().startsWith('fca_')) {
        setConnectionState({ status: 'error', message: 'Connection cancelled. Please click "Connect Bank Account" to try again.' });
        return;
      }

      // 3. Confirm SetupIntent + send Slack notification
      setConnectionState({ status: 'submitting' });
      showSnack('success', 'Bank account connected successfully!');

      const confirmRes = await fetch('/api/confirm-and-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          setupIntentId,
          financialConnectionsAccountId: fcaId,
          customerInfo,
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        console.error('Confirm/notify failed:', err);
        // Don't block success — the bank is connected even if notification fails
      }

      setConnectionState({ status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect bank account';
      setConnectionState({ status: 'error', message });
    }
  };

  const isConnecting = connectionState.status === 'connecting' || connectionState.status === 'submitting';
  const isSuccess = connectionState.status === 'success';
  const errorMessage = connectionState.status === 'error' ? connectionState.message : null;

  return (
    <div className="flex flex-row animate-fade-in-right duration-1000 lg:w-[70%] xs:w-[100%] mx-auto h-full">
      <main className="w-full h-full flex flex-col bg-white p-6">
        <div className="flex justify-center items-center">
          <img src="/logo_side_black.svg" alt="Logo" className="w-48" />
        </div>

        <div className="min-h-screen bg-white py-8">
          <div className="w-full h-full flex flex-col">
            {/* Success banner */}
            {isSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Bank account connected on {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 rounded-lg overflow-hidden min-h-[300px]">
              {isSuccess ? (
                <div className="flex items-center p-4 justify-center h-full bg-green-50">
                  <div className="text-center max-w-md">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Bank Account Connected!</h3>
                    <p className="text-green-700 mb-4">Your bank account has been successfully connected.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Bank Account</h3>
                    <p className="text-gray-600 mb-6">
                      Securely connect your bank account using Stripe Financial Connections.
                    </p>

                    {/* Customer info form */}
                    <div className="space-y-4 mb-6 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          data-testid="full-name-input"
                          type="text"
                          value={customerInfo.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          onBlur={() => handleBlur('fullName')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="John Doe"
                        />
                        {touchedFields.fullName && errors.fullName && (
                          <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          data-testid="company-name-input"
                          type="text"
                          value={customerInfo.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          onBlur={() => handleBlur('companyName')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Acme Inc."
                        />
                        {touchedFields.companyName && errors.companyName && (
                          <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          data-testid="email-input"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="john@company.com"
                        />
                        {touchedFields.email && errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>
                      {!isValid && (
                        <p className="text-xs text-gray-500">
                          Fill in full name, company name, and a valid email to enable bank connection.
                        </p>
                      )}
                    </div>

                    <button
                      data-testid="connect-bank-account-button"
                      onClick={() => {
                        setConnectionState({ status: 'idle' });
                        setTouchedFields({ fullName: true, companyName: true, email: true });
                        if (isValid) startFinancialConnections();
                      }}
                      disabled={isConnecting || !isValid}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 font-medium"
                    >
                      {isConnecting ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Connecting...
                        </span>
                      ) : (
                        'Connect Bank Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {connectionState.status === 'submitting' && (
            <div className="mt-4 text-center text-gray-600">Submitting your information...</div>
          )}
        </div>
      </main>

      {/* Snackbar */}
      {snackMessage && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md w-full mx-4 ${
            snackMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-center">
            <span className="font-medium text-center">{snackMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `app/form/page.tsx` to wire up searchParams**

```tsx
import FormPage from './FormPage';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ companyName?: string }>;
}) {
  const params = await searchParams;
  const companyName = params.companyName?.trim() || '';

  return <FormPage initialCompanyName={companyName} />;
}
```

- [ ] **Step 3: Add root redirect from `/` to `/form`**

Create `app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/form');
}
```

- [ ] **Step 4: Verify the build compiles**

```bash
npx next build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/form/FormPage.tsx app/form/page.tsx app/page.tsx
git commit -m "feat: add form page with Stripe Financial Connections client flow"
```

---

## Task 6: Write E2E tests

**Files:**
- Create: `e2e/closing-flow.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Update `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 2: Create `e2e/closing-flow.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const TEST_COMPANY_NAME = 'TestCompany Inc.';
const TEST_EMAIL = 'test@testcompany.com';
const TEST_FULL_NAME = 'John Doe';

test.describe('closing form flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Mock Stripe.js
    await context.addInitScript(() => {
      Object.defineProperty(window, 'Stripe', {
        configurable: true,
        writable: true,
        value: () => ({
          collectFinancialConnectionsAccounts: async () => ({
            financialConnectionsSession: {
              id: 'fcsess_test_e2e',
              status: 'completed',
              accounts: {
                data: [{ id: 'fca_test_e2e' }],
              },
            },
          }),
        }),
      });
    });

    // Intercept Stripe.js script load
    await page.route('https://js.stripe.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '// mocked',
      });
    });

    // Mock /api/create-fca
    await page.route('**/api/create-fca', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fcsess_test_e2e',
          client_secret: 'fcsess_client_secret_test',
          customerId: 'cus_test_e2e',
          setupIntentId: 'seti_test_e2e',
        }),
      });
    });

    // Mock /api/confirm-and-notify
    await page.route('**/api/confirm-and-notify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('shows the form and navigates to /form by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/form/);
    await expect(page.getByRole('heading', { name: 'Connect Your Bank Account' })).toBeVisible();
  });

  test('pre-fills company name from query parameter', async ({ page }) => {
    await page.goto(`/form?companyName=${encodeURIComponent(TEST_COMPANY_NAME)}`);
    await expect(page.getByTestId('company-name-input')).toHaveValue(TEST_COMPANY_NAME);
  });

  test('validates required fields before enabling button', async ({ page }) => {
    await page.goto('/form');
    const button = page.getByTestId('connect-bank-account-button');
    await expect(button).toBeDisabled();

    await page.getByTestId('full-name-input').fill(TEST_FULL_NAME);
    await page.getByTestId('company-name-input').fill(TEST_COMPANY_NAME);
    await page.getByTestId('email-input').fill(TEST_EMAIL);

    await expect(button).toBeEnabled();
  });

  test('completes the full bank connection flow end to end', async ({ page }) => {
    await page.goto(`/form?companyName=${encodeURIComponent(TEST_COMPANY_NAME)}`);

    await expect(page.getByTestId('company-name-input')).toHaveValue(TEST_COMPANY_NAME);

    await page.getByTestId('full-name-input').fill(TEST_FULL_NAME);
    await page.getByTestId('email-input').fill(TEST_EMAIL);

    await page.getByTestId('connect-bank-account-button').click();

    await expect(page.getByRole('heading', { name: 'Bank Account Connected!' })).toBeVisible();
    await expect(page.getByText('Your bank account has been successfully connected.')).toBeVisible();
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts e2e/closing-flow.spec.ts
git commit -m "test: add E2E tests for closing form flow"
```

---

## Task 7: Clean up old CRA files

**Files:**
- Delete: `src/` (entire directory)
- Delete: `public/index.html`
- Delete: `public/404.html`
- Delete: `public/_redirects`
- Delete: `public/manifest.json`
- Delete: `public/robots.txt`
- Delete: `build/` (entire directory)
- Delete: `e2e/password-flow.spec.ts`
- Delete: `.env` (will recreate from .env.example with real values)

- [ ] **Step 1: Remove old source files**

```bash
rm -rf src/
rm -rf build/
rm -f public/index.html public/404.html public/_redirects public/manifest.json public/robots.txt
rm -f e2e/password-flow.spec.ts
```

- [ ] **Step 2: Verify build still works**

```bash
npx next build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove CRA source files, old E2E tests, and build artifacts"
```

---

## Task 8: Set up environment and run E2E tests

**Files:**
- Modify: `.env` (add real test values)

- [ ] **Step 1: Set up `.env` with test values**

Ask the user for:
- `STRIPE_SECRET_KEY` — their `sk_test_` key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — their `pk_test_` key
- `SLACK_BOT_TOKEN` — their Slack bot token (`xoxb-`)
- `SENTRY_DSN` — their Sentry DSN

Create `.env`:
```
STRIPE_SECRET_KEY=sk_test_<provided>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<provided>
SLACK_BOT_TOKEN=xoxb-<provided>
SLACK_CHANNEL_ID=C09H2RMPR9P
SENTRY_DSN=<provided>
```

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:3001/form` — verify the form loads, styling is correct, companyName query param works.

- [ ] **Step 3: Run E2E tests**

```bash
npx playwright install chromium
npx playwright test
```

Expected: All 4 tests pass:
- `shows the form and navigates to /form by default`
- `pre-fills company name from query parameter`
- `validates required fields before enabling button`
- `completes the full bank connection flow end to end`

- [ ] **Step 4: Commit (if any test fixes were needed)**

```bash
git add -A
git commit -m "fix: adjust tests for passing E2E suite"
```

---

## Task 9: Final verification and cleanup

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run E2E tests one more time**

```bash
npx playwright test
```

Expected: All tests pass.

- [ ] **Step 3: Verify `.env` is in `.gitignore`**

Check `.gitignore` includes `.env`. It should already be there but verify.

- [ ] **Step 4: Final commit with any remaining changes**

```bash
git add -A
git commit -m "chore: final cleanup for Next.js migration"
```

---

## Access Requirements Summary

To complete this migration, the user needs to provide:

| Secret | Where to get it | Used by |
|--------|----------------|---------|
| `STRIPE_SECRET_KEY` (sk_test_) | Stripe Dashboard > Developers > API keys | `/api/create-fca`, `/api/confirm-and-notify` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_) | Stripe Dashboard > Developers > API keys | Client-side Stripe.js |
| `SLACK_BOT_TOKEN` (xoxb-) | Slack API > Your App > OAuth & Permissions | `/api/confirm-and-notify` |
| `SENTRY_DSN` | Sentry > Project Settings > Client Keys | Error tracking |

The Slack bot needs the `chat:write` scope and must be invited to `#origination-closing`.
