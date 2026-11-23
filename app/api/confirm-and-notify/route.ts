import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { notifyBankConnected } from '@/lib/notify';
import { bankDetails, fcAccountDetails, type BankDetails } from '@/lib/bankDetails';
import { confirmParams } from '@/lib/confirmParams';
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

    // Confirm the SetupIntent with a payment method built from the connected FC account (nothing else creates one).
    // A failure goes to Sentry and never blocks the notification; scripts/setup-intents-report.mjs shows it.
    try {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      const fca = await stripe.financialConnections.accounts.retrieve(financialConnectionsAccountId);
      if (setupIntent.customer !== customerId || fca.account_holder?.customer !== customerId) {
        throw new Error(`SetupIntent ${setupIntentId} / ${financialConnectionsAccountId} do not belong to ${customerId}`);
      }
      if (setupIntent.status === 'requires_payment_method') {
        const ip = request.headers.get('x-nf-client-connection-ip')
          ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
          ?? '127.0.0.1'; // ponytail: local next start only, Netlify always sends the client IP
        await stripe.setupIntents.confirm(
          setupIntentId,
          confirmParams(financialConnectionsAccountId, customerInfo, ip, request.headers.get('user-agent') ?? 'unknown'),
        );
      }
    } catch (confirmError) {
      Sentry.captureException(confirmError);
    }

    // Bank name + last 4 digits for the Slack message; a failure here never blocks the notification.
    let details: BankDetails = {};
    try {
      const si = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] });
      details = bankDetails(si.payment_method);
      // Confirm failed (no payment method): bank name + last 4 from the connected Financial Connections account
      if (!details.bankName && !details.accountLast4) {
        details = fcAccountDetails(await stripe.financialConnections.accounts.retrieve(financialConnectionsAccountId));
      }
    } catch (detailsError) {
      Sentry.captureException(detailsError);
    }

    // The bank is connected at this point: a notification failure goes to Sentry, never back to the customer.
    try {
      await notifyBankConnected({
        companyName: customerInfo.companyName,
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        customerId,
        financialConnectionsAccountId,
        ...details,
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
