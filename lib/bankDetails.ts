import type Stripe from 'stripe';

export type BankDetails = { bankName?: string; routingLast4?: string; accountLast4?: string };

// Bank name + last 4 digits of the routing and account numbers, for the "Bank account connected" Slack message
// (checked against schedule 2 of the contract). Only the last 4 digits ever leave this server.
// Tested by scripts/check-bank-details.mjs.
export function bankDetails(pm: Stripe.PaymentMethod | string | null | undefined): BankDetails {
  if (!pm || typeof pm === 'string' || pm.type !== 'us_bank_account' || !pm.us_bank_account) return {};
  const { bank_name, last4, routing_number } = pm.us_bank_account;
  return {
    ...(bank_name ? { bankName: bank_name } : {}),
    ...(routing_number ? { routingLast4: routing_number.slice(-4) } : {}),
    ...(last4 ? { accountLast4: last4 } : {}),
  };
}

// The form connects the bank with Financial Connections and creates no payment method (SetupIntent stays
// requires_payment_method), so the bank name + last 4 come from the connected account. It has no routing number,
// and for tokenized accounts (Chase) last4 is the tokenized number's.
export function fcAccountDetails(acct: Pick<Stripe.FinancialConnections.Account, 'institution_name' | 'last4'> | null | undefined): BankDetails {
  if (!acct) return {};
  return {
    ...(acct.institution_name ? { bankName: acct.institution_name } : {}),
    ...(acct.last4 ? { accountLast4: acct.last4 } : {}),
  };
}
