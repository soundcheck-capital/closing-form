import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSlack, SLACK_CHANNEL_ID } from '@/lib/slack';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, setupIntentId, financialConnectionsAccountId, customerInfo } = body;

    const stripe = getStripe();
    const slack = getSlack();

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

    const stripeCustomerUrl = `https://dashboard.stripe.com/customers/${customerId}`;
    const slackMessage =
      `:bank: Bank account connected!\n` +
      `*Company:* ${customerInfo.companyName}\n` +
      `*Contact:* ${customerInfo.fullName} (${customerInfo.email})\n` +
      `*Stripe Customer:* <${stripeCustomerUrl}|${customerId}>\n` +
      `*FCA Account:* ${financialConnectionsAccountId}`;

    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: slackMessage,
      mrkdwn: true,
    });

    Sentry.captureMessage('Bank account confirmed & Slack notified', 'info');

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
