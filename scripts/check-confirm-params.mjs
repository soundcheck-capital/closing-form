// Checks lib/confirmParams.ts: the SetupIntent confirm builds the payment method from the FC account and records
// the mandate from the customer's request. Usage: node scripts/check-confirm-params.mjs
import assert from 'node:assert/strict';
import { confirmParams } from '../lib/confirmParams.ts';

const p = confirmParams('fca_123', { fullName: 'Ian M', email: 'ian@x.com' }, '203.0.113.7', 'Mozilla/5.0');
assert.equal(p.payment_method_data.type, 'us_bank_account');
assert.equal(p.payment_method_data.us_bank_account.financial_connections_account, 'fca_123');
assert.deepEqual(p.payment_method_data.billing_details, { name: 'Ian M', email: 'ian@x.com' });
assert.deepEqual(p.mandate_data.customer_acceptance, { type: 'online', online: { ip_address: '203.0.113.7', user_agent: 'Mozilla/5.0' } });
assert.ok(!('payment_method' in p), 'no lookup of an existing payment method (there never is one: 0/58 since June)');
console.log('all ok');
