'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

type CustomerInfo = {
  fullName: string;
  companyName: string;
  email: string;
};

type ConnectionState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function FormPage({ initialCompanyName }: { initialCompanyName: string }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    companyName: initialCompanyName,
    email: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    companyName: false,
    email: false,
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'idle' });
  const [snackMessage, setSnackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = {
    fullName: customerInfo.fullName.trim().length < 2 ? 'Please enter a valid full name.' : '',
    companyName: customerInfo.companyName.trim().length < 2 ? 'Please enter a valid company name.' : '',
    email: emailPattern.test(customerInfo.email.trim()) ? '' : 'Please enter a valid email address.',
  };
  const isValid = !errors.fullName && !errors.companyName && !errors.email;

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CustomerInfo) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const showSnack = useCallback((type: 'success' | 'error', message: string) => {
    setSnackMessage({ type, message });
    setTimeout(() => setSnackMessage(null), type === 'success' ? 3000 : 5000);
  }, []);

  const startFinancialConnections = async () => {
    setConnectionState({ status: 'connecting' });

    try {
      const createRes = await fetch('/api/create-fca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerInfo),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create FCA session');
      }

      const { client_secret, customerId, setupIntentId } = await createRes.json();

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const result = await stripe.collectFinancialConnectionsAccounts({ clientSecret: client_secret });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const accounts = result.financialConnectionsSession?.accounts ?? [];

      if (accounts.length === 0) {
        setConnectionState({ status: 'error', message: 'Connection cancelled. Please click "Connect Bank Account" to try again.' });
        return;
      }

      const fcaId = accounts[0].id;
      if (!fcaId?.startsWith('fca_')) {
        setConnectionState({ status: 'error', message: 'Connection cancelled. Please click "Connect Bank Account" to try again.' });
        return;
      }

      setConnectionState({ status: 'submitting' });
      showSnack('success', 'Bank account connected successfully!');

      const confirmRes = await fetch('/api/confirm-and-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          setupIntentId,
          financialConnectionsAccountId: fcaId,
          customerInfo,
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        console.error('Confirm/notify failed:', err);
        // ponytail: don't block success — bank is connected even if notification fails
      }

      setConnectionState({ status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect bank account';
      setConnectionState({ status: 'error', message });
    }
  };

  const isConnecting = connectionState.status === 'connecting' || connectionState.status === 'submitting';
  const isSuccess = connectionState.status === 'success';
  const errorMessage = connectionState.status === 'error' ? connectionState.message : null;

  return (
    <div className="flex flex-row animate-fade-in-right duration-1000 lg:w-[70%] xs:w-[100%] mx-auto h-full">
      <main className="w-full h-full flex flex-col bg-white p-6">
        <div className="flex justify-center items-center">
          <img src="/logo_side_black.svg" alt="Logo" className="w-48" />
        </div>

        <div className="min-h-screen bg-white py-8">
          <div className="w-full h-full flex flex-col">
            {isSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Bank account connected on {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="flex-1 rounded-lg overflow-hidden min-h-[300px]">
              {isSuccess ? (
                <div className="flex items-center p-4 justify-center h-full bg-green-50">
                  <div className="text-center max-w-md">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Bank Account Connected!</h3>
                    <p className="text-green-700 mb-4">Your bank account has been successfully connected.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Bank Account</h3>
                    <p className="text-gray-600 mb-6">
                      Securely connect your bank account using Stripe Financial Connections.
                    </p>

                    <div className="space-y-4 mb-6 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          data-testid="full-name-input"
                          type="text"
                          value={customerInfo.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          onBlur={() => handleBlur('fullName')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="John Doe"
                        />
                        {touchedFields.fullName && errors.fullName && (
                          <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          data-testid="company-name-input"
                          type="text"
                          value={customerInfo.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          onBlur={() => handleBlur('companyName')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Acme Inc."
                        />
                        {touchedFields.companyName && errors.companyName && (
                          <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          data-testid="email-input"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="john@company.com"
                        />
                        {touchedFields.email && errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>
                      {!isValid && (
                        <p className="text-xs text-gray-500">
                          Fill in full name, company name, and a valid email to enable bank connection.
                        </p>
                      )}
                    </div>

                    <button
                      data-testid="connect-bank-account-button"
                      onClick={() => {
                        setConnectionState({ status: 'idle' });
                        setTouchedFields({ fullName: true, companyName: true, email: true });
                        if (isValid) startFinancialConnections();
                      }}
                      disabled={isConnecting || !isValid}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 font-medium"
                    >
                      {isConnecting ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Connecting...
                        </span>
                      ) : (
                        'Connect Bank Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {connectionState.status === 'submitting' && (
              <div className="mt-4 text-center text-gray-600">Submitting your information...</div>
            )}
          </div>
        </div>
      </main>

      {snackMessage && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md w-full mx-4 ${
            snackMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-center">
            <span className="font-medium text-center">{snackMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
