import type Stripe from 'stripe';

// Confirm params for the SetupIntent: the payment method is created from the connected Financial Connections
// account and the mandate is recorded from the customer's own request (IP + browser). Same request the Make
// scenario "Finalize Setup Intent – Step 2" sent until the June 2026 migration; the client already authorized
// ACH debits in SoundCheck's documents (Sami 2026-11-23). Tested by scripts/check-confirm-params.mjs.
export function confirmParams(
  financialConnectionsAccountId: string,
  customer: { fullName: string; email: string },
  ipAddress: string,
  userAgent: string,
): Stripe.SetupIntentConfirmParams {
  return {
    payment_method_data: {
      type: 'us_bank_account',
      us_bank_account: { financial_connections_account: financialConnectionsAccountId },
      billing_details: { name: customer.fullName, email: customer.email },
    },
    mandate_data: {
      customer_acceptance: { type: 'online', online: { ip_address: ipAddress, user_agent: userAgent } },
    },
  };
}
