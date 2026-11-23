import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { notifyBankConnected } from '@/lib/notify';
import { bankDetails } from '@/lib/bankDetails';
import * as Sentry from '@sentry/nextjs';

// Called after the customer accepted the mandate and Stripe.js confirmed the SetupIntent.
// The server never confirms (a mandate must come from the customer): it only checks the SetupIntent
// really succeeded with a us_bank_account payment method, then notifies.
export async function POST(request: NextRequest) {
  try {
    const { customerId, setupIntentId, customerInfo } = await request.json();

    if (!customerId || !setupIntentId || !customerInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stripe = getStripe();
    const si = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] });
    const pm = typeof si.payment_method === 'object' ? si.payment_method : null;

    if (si.customer !== customerId || si.status !== 'succeeded' || pm?.type !== 'us_bank_account') {
      Sentry.captureMessage(`SetupIntent ${setupIntentId} not confirmed (${si.status})`, 'error');
      return NextResponse.json({ error: 'Bank account not confirmed' }, { status: 409 });
    }

    // The bank is connected at this point: a notification failure goes to Sentry, never back to the customer.
    try {
      await notifyBankConnected({
        companyName: customerInfo.companyName,
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        customerId,
        financialConnectionsAccountId: pm.us_bank_account?.financial_connections_account ?? '',
        ...bankDetails(pm),
      });
      Sentry.captureMessage('Bank account confirmed & notified', 'info');
    } catch (notifyError) {
      Sentry.captureException(notifyError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
