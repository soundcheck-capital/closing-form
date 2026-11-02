import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { notifyBankConnected } from '@/lib/notify';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, setupIntentId, financialConnectionsAccountId, customerInfo } = body;

    const stripe = getStripe();

    if (!customerId || !setupIntentId || !financialConnectionsAccountId || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status === 'requires_payment_method' || setupIntent.status === 'requires_confirmation') {
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

    // The bank is connected at this point: a notification failure goes to Sentry, never back to the customer.
    try {
      await notifyBankConnected({
        companyName: customerInfo.companyName,
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        customerId,
        financialConnectionsAccountId,
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
