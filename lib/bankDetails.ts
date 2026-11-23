import type Stripe from 'stripe';

export type BankDetails = { bankName?: string; accountLast4?: string };

// Bank name + last 4 digits of the account, for the "Bank account connected" Slack message (checked against
// schedule 2 of the contract). No routing number (Sami 2026-11-23).
// Tested by scripts/check-bank-details.mjs.
export function bankDetails(pm: Stripe.PaymentMethod | string | null | undefined): BankDetails {
  if (!pm || typeof pm === 'string' || pm.type !== 'us_bank_account' || !pm.us_bank_account) return {};
  const { bank_name, last4 } = pm.us_bank_account;
  return {
    ...(bank_name ? { bankName: bank_name } : {}),
    ...(last4 ? { accountLast4: last4 } : {}),
  };
}
