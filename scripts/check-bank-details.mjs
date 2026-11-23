// Checks lib/bankDetails.ts (bank name + last 4 digits for the n8n "Bank account connected" Slack message).
// Usage: node scripts/check-bank-details.mjs  (Node 22.18+ strips the TypeScript types)
import assert from 'node:assert/strict';
import { bankDetails } from '../lib/bankDetails.ts';

const pm = { id: 'pm_1', type: 'us_bank_account', us_bank_account: { bank_name: 'JPMorgan Chase', last4: '6789', routing_number: '021000021' } };
const out = bankDetails(pm);
assert.deepEqual(out, { bankName: 'JPMorgan Chase', accountLast4: '6789' });
assert.ok(!/0021|routing/i.test(JSON.stringify(out)), 'no routing number is sent (Sami 2026-11-23)');
for (const v of ['pm_123', null, undefined, { id: 'pm_2', type: 'card', card: {} }]) assert.deepEqual(bankDetails(v), {});
assert.deepEqual(bankDetails({ id: 'pm_3', type: 'us_bank_account', us_bank_account: { bank_name: null, last4: '1111', routing_number: null } }),
  { accountLast4: '1111' });
console.log('all ok');
