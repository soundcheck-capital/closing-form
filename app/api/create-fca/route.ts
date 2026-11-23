import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, companyName, email } = body;

    const stripe = getStripe();

    if (!fullName || !companyName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, companyName, email' },
        { status: 400 }
      );
    }

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
        },
      },
    });

    const fcSession = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'customer',
        customer: customer.id,
      },
      permissions: ['payment_method', 'balances', 'ownership', 'transactions'],
      prefetch: ['balances'],
    });

    Sentry.captureMessage('FCA session created', 'info');

    return NextResponse.json({
      id: fcSession.id,
      client_secret: fcSession.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
