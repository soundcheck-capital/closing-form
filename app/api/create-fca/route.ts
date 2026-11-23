import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import * as Sentry from '@sentry/nextjs';

// One SetupIntent drives everything: the client links the bank through Financial Connections
// (collectBankAccountForSetup, same FC permissions as before for the CSV flows), which attaches a us_bank_account
// payment method, then the customer accepts the ACH mandate and confirmUsBankAccountSetup confirms it.
// Before 2026-11-23 a separate FC session was used and no payment method was ever created (0 confirmed since June).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, companyName, email } = body;

    if (!fullName || !companyName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, companyName, email' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const customer = await stripe.customers.create({
      name: fullName,
      email,
      description: companyName,
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          verification_method: 'instant',
          financial_connections: {
            permissions: ['payment_method', 'balances', 'ownership', 'transactions'],
            prefetch: ['balances'],
          },
        },
      },
    });

    Sentry.captureMessage('SetupIntent created', 'info');

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
