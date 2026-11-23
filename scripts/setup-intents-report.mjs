// Read-only report on the closing-form Stripe account: are bank connections ending in a confirmed SetupIntent?
// Usage: STRIPE_KEY=rk_live_... node scripts/setup-intents-report.mjs [--since 2026-11-24] [--csv out.csv]
//   (rk_live = the read-only key of n8n "Stripe FC CSV Generation + Notifications"; sk_test works in test mode)
// Prints SetupIntent counts by status, before/after the 2026-06-16 migration, and writes the customers whose
// SetupIntent never succeeded (customer, company, date, FC accounts + permissions) to the CSV.
// --since: exits 1 if any SetupIntent created after that date (and over 1 hour old) is not succeeded.
// Only GET requests.
import { writeFileSync } from 'node:fs';

const KEY = process.env.STRIPE_KEY;
if (!KEY) throw new Error('STRIPE_KEY is not set');
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const since = arg('--since') ? Date.parse(arg('--since')) / 1000 : null;
const csvPath = arg('--csv');
const MIGRATION = Date.parse('2026-06-16') / 1000;

const get = async (path, qs = {}) => {
  const res = await fetch(`https://api.stripe.com/v1/${path}?${new URLSearchParams(qs)}`, { headers: { Authorization: `Bearer ${KEY}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path}: ${body.error?.message ?? res.status}`);
  return body;
};
const all = async (path, qs = {}) => {
  let out = [], after;
  do {
    const page = await get(path, { limit: 100, ...qs, ...(after ? { starting_after: after } : {}) });
    out = out.concat(page.data);
    after = page.has_more ? page.data.at(-1).id : undefined;
  } while (after);
  return out;
};

const intents = await all('setup_intents', { 'expand[]': 'data.customer' });
const day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const count = (list) => list.reduce((m, s) => ({ ...m, [s.status]: (m[s.status] ?? 0) + 1 }), {});
const before = intents.filter((s) => s.created < MIGRATION), after = intents.filter((s) => s.created >= MIGRATION);
console.log(`${intents.length} SetupIntents`);
console.log('before 2026-06-16:', count(before), `with payment method: ${before.filter((s) => s.payment_method).length}`);
console.log('since 2026-06-16: ', count(after), `with payment method: ${after.filter((s) => s.payment_method).length}`);

const pending = after.filter((s) => s.status !== 'succeeded' && s.status !== 'canceled');
if (csvPath) {
  const rows = [['setup_intent', 'status', 'created', 'customer', 'name', 'company', 'email', 'fc_accounts', 'payment_method_permission', 'has_succeeded_seti']];
  const succeededCustomers = new Set(intents.filter((s) => s.status === 'succeeded').map((s) => s.customer?.id ?? s.customer));
  for (const s of pending) {
    const c = typeof s.customer === 'object' && s.customer ? s.customer : { id: s.customer };
    const accts = c.id && !c.deleted ? await all('financial_connections/accounts', { 'account_holder[customer]': c.id }) : [];
    rows.push([s.id, s.status, day(s.created), c.id ?? '', c.deleted ? '(customer deleted)' : c.name ?? '', c.description ?? '', c.email ?? '',
      accts.map((a) => `${a.id} ${a.institution_name} ${a.last4} ${a.status}`).join(' | '),
      accts.length ? accts.every((a) => a.permissions?.includes('payment_method')) : '',
      succeededCustomers.has(c.id)]);
  }
  writeFileSync(csvPath, rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n');
  console.log(`${pending.length} unconfirmed since 2026-06-16 -> ${csvPath}`);
}

if (since) {
  const hourAgo = Date.now() / 1000 - 3600;
  const bad = intents.filter((s) => s.created >= since && s.created < hourAgo && s.status !== 'succeeded');
  for (const s of bad) console.log(`NOT CONFIRMED ${s.id} ${s.status} ${day(s.created)}`);
  console.log(bad.length ? `FAIL: ${bad.length} not confirmed since ${arg('--since')}` : `ok: every SetupIntent since ${arg('--since')} succeeded`);
  process.exit(bad.length ? 1 : 0);
}
