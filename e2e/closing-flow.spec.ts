import { expect, test } from '@playwright/test';

const TEST_COMPANY_NAME = 'TestCompany Inc.';
const TEST_EMAIL = 'test@testcompany.com';
const TEST_FULL_NAME = 'John Doe';

test.describe('closing form flow', () => {
  test.beforeEach(async ({ context, page }) => {
    await page.route(/https:\/\/js\.stripe\.com\//, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.__stripeCalls = [];
          window.Stripe = function(pk) {
            return {
              collectBankAccountForSetup: function(opts) {
                window.__stripeCalls.push('collect:' + opts.clientSecret + ':' + opts.params.payment_method_type);
                return Promise.resolve({ setupIntent: { id: 'seti_test_e2e', status: 'requires_confirmation', payment_method: 'pm_test_e2e' } });
              },
              confirmUsBankAccountSetup: function(clientSecret) {
                window.__stripeCalls.push('confirm:' + clientSecret);
                return Promise.resolve({ setupIntent: { id: 'seti_test_e2e', status: 'succeeded', payment_method: 'pm_test_e2e' } });
              },
            };
          };
          window.Stripe.version = "3.0.0";
        `,
      });
    });

    await page.route('**/api/create-fca', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          client_secret: 'seti_test_e2e_secret_test',
          customerId: 'cus_test_e2e',
          setupIntentId: 'seti_test_e2e',
        }),
      });
    });

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

    // The customer must see and accept the ACH mandate: nothing is confirmed before the click
    await expect(page.getByTestId('ach-mandate-text')).toContainText('authorize SoundCheck Capital to debit');
    expect(await page.evaluate(() => (window as any).__stripeCalls)).toEqual(['collect:seti_test_e2e_secret_test:us_bank_account']);

    const notify = page.waitForRequest('**/api/confirm-and-notify');
    await page.getByTestId('accept-mandate-button').click();
    expect((await notify).postDataJSON()).toMatchObject({ customerId: 'cus_test_e2e', setupIntentId: 'seti_test_e2e' });
    expect(await page.evaluate(() => (window as any).__stripeCalls)).toEqual([
      'collect:seti_test_e2e_secret_test:us_bank_account',
      'confirm:seti_test_e2e_secret_test',
    ]);

    await expect(page.getByRole('heading', { name: 'Bank Account Connected!' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your bank account has been successfully connected.')).toBeVisible();
  });
});
