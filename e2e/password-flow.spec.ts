import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const TEST_COMPANY_NAME = readEnvValue('PLAYWRIGHT_TEST_COMPANY_NAME') || 'soundcheckcapital.com';
const TEST_EMAIL = 'owner@soundcheckcapital.com';
const TEST_FULL_NAME = 'SoundCheck Capital';
const TEST_PASSWORD = readEnvValue('PLAYWRIGHT_TEST_PASSWORD');

function readEnvValue(name: string): string {
  const directValue = process.env[name]?.trim();
  if (directValue) {
    return directValue;
  }

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return '';
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  const match = envFile.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim() || '';
}

test.describe('customer link password flow', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'Stripe', {
        configurable: true,
        writable: true,
        value: () => ({
          collectFinancialConnectionsAccounts: async () => ({
            financialConnectionsSession: {
              id: 'fcsess_real_e2e',
              status: 'completed',
              accounts: {
                data: [{ id: 'fca_real_e2e' }]
              }
            }
          })
        })
      });
    });

    await page.route('https://js.stripe.com/v3/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.Stripe = window.Stripe || function(){ return { collectFinancialConnectionsAccounts: async function(){ return { financialConnectionsSession: { id: "fcsess_real_e2e", status: "completed", accounts: { data: [{ id: "fca_real_e2e" }] } } }; } }; };'
      });
    });
  });

  test('completes the full protected customer-link flow end to end', async ({ page }) => {
    expect(TEST_PASSWORD, 'Set PLAYWRIGHT_TEST_PASSWORD in .env or your shell before running the real E2E test').toBeTruthy();

    await page.goto(`/form?companyName=${encodeURIComponent(TEST_COMPANY_NAME)}`);

    await expect(page.getByText('Access Required')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();

    await page.getByTestId('password-input').fill(TEST_PASSWORD);
    await page.getByTestId('password-submit').click();

    await expect(page).toHaveURL(new RegExp(`/form\\?companyName=${TEST_COMPANY_NAME.replace('.', '\\.')}`));
    await expect(page.getByRole('heading', { name: 'Connect Your Bank Account' })).toBeVisible();

    await expect(page.getByTestId('company-name-input')).toHaveValue(TEST_COMPANY_NAME);
    await page.getByTestId('full-name-input').fill(TEST_FULL_NAME);
    await page.getByTestId('email-input').fill(TEST_EMAIL);

    await page.getByTestId('connect-bank-account-button').click();

    await expect(page).toHaveURL(new RegExp(`/form\\?companyName=${TEST_COMPANY_NAME.replace('.', '\\.')}`));
    await expect(page.getByRole('heading', { name: 'Bank Account Connected!' })).toBeVisible();
    await expect(page.getByText('Bank account connected successfully!')).toBeVisible();

    const authenticated = await page.evaluate(() => localStorage.getItem('formAuthenticated'));
    expect(authenticated).toBe('true');
  });
});
