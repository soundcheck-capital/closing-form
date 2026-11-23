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

// Fallback when the SetupIntent confirm failed (no payment method): bank name + last 4 from the connected
// Financial Connections account. For tokenized accounts (Chase) last4 is the tokenized number's.
export function fcAccountDetails(acct: Pick<Stripe.FinancialConnections.Account, 'institution_name' | 'last4'> | null | undefined): BankDetails {
  if (!acct) return {};
  return {
    ...(acct.institution_name ? { bankName: acct.institution_name } : {}),
    ...(acct.last4 ? { accountLast4: acct.last4 } : {}),
  };
}
