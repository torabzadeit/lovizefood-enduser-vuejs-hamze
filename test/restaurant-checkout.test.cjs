const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createCheckout, phone, validBill, gatewayUrl, disconnectedAdapter } = require('../utils/restaurantCheckout.cjs');
const { createLocalAdapter } = require('../utils/restaurantCheckoutAdapter.cjs');
const { createCheckoutMock, ROOT } = require('../dev-mock/restaurant-checkout.cjs');
const catalog = { products: [{ key: 'food', name: 'غذا', price: 100000, discount_percent: 10, add_unit: .5 }], taxEnabled: true, taxPercent: 10 };
const items = [{ ...catalog.products[0], count: 1, unit_name: 'کیلوگرم' }];
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function setup(options = {}) {
  let time = 1000, counter = 0, completions = [], redirects = [];
  const server = createCheckoutMock(catalog, { now: () => time, ...options });
  const calls = [], device = { token: 'device-A' };
  const adapter = { localOnly: true, origin: 'http://127.0.0.1:3999' };
  for (const method of ['preview', 'challenge', 'verify', 'discounts', 'confirmCard', 'cancel', 'online', 'reconcile', 'revoke']) adapter[method] = async body => {
    calls.push({ method, body });
    const response = server.handle('POST', ROOT + method, body, device);
    if (response.status >= 400) {
      if (response.body.unavailable) return disconnectedAdapter()[method]();
      throw Object.assign(Error('HTTP ' + response.status), { status: response.status });
    }
    return method === 'online' ? { ...response.body, payment_link: new URL(response.body.payment_link, adapter.origin).href } : response.body;
  };
  const create = custom => createCheckout({ items, adapter, now: () => time, id: () => 'opaque-id-' + ++counter,
    complete: result => completions.push(result), redirect: url => redirects.push(url), ...custom });
  return { server, adapter, calls, create, device, completions, redirects, advance: ms => { time += ms; } };
}
async function prepared(h) { const c = h.create(); c.setPhone('09123456789'); await c.preview(); return c; }
async function verified(c) { await c.viewDiscounts(); c.state.otp = '246810'; assert.equal(await c.verify(), true); }

test('quote pending, failure and retry preserve table controls and block payment', async () => {
  const h = setup(), c = await prepared(h), original = h.adapter.preview;
  const pending = deferred(); h.adapter.preview = () => pending.promise;
  c.state.items[0].count = 2;
  const request = c.preview();
  assert.equal(c.state.quoting, true); assert.equal(c.state.bill, null);
  assert.equal(c.ready(), false); assert.equal(c.openCard(), false);
  pending.reject(Error('offline')); assert.equal(await request, false);
  assert.equal(c.state.quoting, false); assert.equal(c.state.bill, null); assert.ok(c.state.error);
  const retry = deferred(); h.adapter.preview = async body => { await retry.promise; return original(body); };
  const retried = c.preview(); assert.equal(c.state.quoting, true); assert.equal(c.ready(), false);
  retry.resolve(); assert.equal(await retried, true); assert.equal(c.state.quoting, false);
  assert.equal(c.state.error, ''); assert.equal(c.state.items[0].count, 2); assert.equal(c.ready(), true);

  const component = fs.readFileSync(path.join(__dirname, '../components/immersive-menu/RestaurantCheckout.vue'), 'utf8');
  assert.match(component, /:aria-busy="state\.quoting \? 'true' : 'false'"/);
  assert.match(component, /'rc-table-updating': state\.quoting/);
  assert.match(component, /\.rc-table-updating\s*\{\s*opacity:\s*\.5;/);
  assert.match(component, /class="sr-only" role="status" aria-live="polite"/);
  assert.doesNotMatch(component, /در حال محاسبه مبلغ سفارش/);
  assert.match(component, /@click="changeCount\(item, -1\)"/);
  assert.match(component, /@click="changeCount\(item, 1\)"/);
  assert.match(component, /@click="checkout\.preview\(\)"/);
});

test('phone: Persian/Arabic/international digits accepted; letters, mixed +, missing and invalid lengths rejected', () => {
  for (const raw of ['۰۹۱۲۳۴۵۶۷۸۹', '٠٩١٢٣٤٥٦٧٨٩', '+98 912 345 6789', '00989123456789', '9123456789']) assert.equal(phone(raw), '09123456789');
  for (const raw of ['', 'abc09123456789', '0912345678', '091234567899', '0912+3456789', '+00989123456789', '08123456789']) assert.equal(phone(raw), '');
});
test('required phone gates both payments, not menu/quote; order does not require OTP', async () => {
  const h = setup(), c = h.create(); await c.preview();
  assert.equal(c.openCard(), false); assert.equal(await c.online(), false); assert.equal(h.calls.filter(x => x.method === 'online').length, 0);
  c.setPhone('09123456789'); await c.preview(); c.openCard(); h.advance(30000);
  assert.equal(await c.confirmCard(), true); assert.equal(h.completions[0].customer_bound, true);
  assert.equal(h.completions[0].payment_status, 'unverified'); assert.equal(h.calls.some(x => x.method === 'challenge'), false);
});
test('POS actions hidden/blocked at 29.999 seconds and available at exactly 30 seconds; no auto submission', async () => {
  const h = setup(), c = await prepared(h); c.openCard(); h.advance(29999);
  assert.equal(c.cardActionsVisible(), false); assert.equal(await c.confirmCard(), false); assert.equal(await c.cancel(), false);
  h.advance(1); assert.equal(c.cardActionsVisible(), true); assert.equal(h.calls.some(x => x.method === 'confirmCard' || x.method === 'cancel'), false);
  assert.equal(await c.cancel(), true); assert.equal(c.state.result.state, 'cancelled');
});
test('immediate edit preserves phone, verified coupons, fulfilment, code and exact quote; reopening starts a fresh wait', async () => {
  const h = setup(), c = await prepared(h); await verified(c); await c.applyCode('PERSONAL10'); await c.setFulfilment('takeaway');
  const snapshot = JSON.stringify({ items: c.state.items, phone: c.state.phone, codes: c.state.codes, code: c.state.discountCode, bill: c.state.bill });
  c.openCard(); c.edit();
  assert.equal(c.state.phase, 'checkout'); assert.equal(c.state.fulfilment, 'takeaway'); assert.equal(c.state.verified, true);
  assert.equal(snapshot, JSON.stringify({ items: c.state.items, phone: c.state.phone, codes: c.state.codes, code: c.state.discountCode, bill: c.state.bill }));
  assert.equal(h.calls.some(x => ['confirmCard', 'cancel'].includes(x.method)), false);
  h.advance(30000); c.openCard(); assert.equal(c.cardActionsVisible(), false);
});
test('personal card listing and typed personal code require verified cycle; public manual code works without OTP', async () => {
  const h = setup(), c = await prepared(h); assert.equal(await c.applyCode('PERSONAL10'), false); assert.deepEqual(c.state.codes, []);
  assert.equal(await c.applyCode('WELCOME'), true); assert.equal(c.state.bill.discount_amount, 10000);
  await c.viewDiscounts(); c.state.otp = '000000'; assert.equal(await c.verify(), false); assert.deepEqual(c.state.codes, []);
  c.state.otp = '246810'; assert.equal(await c.verify(), true); assert.equal(c.state.codes[0].code, 'PERSONAL10');
  assert.equal(await c.applyCode('PERSONAL10'), true); assert.equal(c.state.bill.discount_amount, 9000);
});
test('phone change clears verified identity, cards, applied code, OTP and quote', async () => {
  const h = setup(), c = await prepared(h); await verified(c); await c.applyCode('PERSONAL10');
  c.setPhone('09123456780'); assert.equal(c.state.verified, false); assert.deepEqual(c.state.codes, []);
  assert.equal(c.state.discountCode, ''); assert.equal(c.state.codeInput, ''); assert.equal(c.state.otp, ''); assert.equal(c.state.bill, null);
  await c.preview(); assert.equal(c.state.bill.discount_amount, 0);
});
test('late verification/discount response A cannot populate customer B or hide B loading state', async () => {
  const h = setup(), late = deferred(), c = await prepared(h); await c.viewDiscounts();
  h.adapter.discounts = () => late.promise; c.state.otp = '246810'; const old = c.verify(); await Promise.resolve(); await Promise.resolve();
  c.setPhone('09123456780'); await c.viewDiscounts(); late.resolve([{ code: 'SECRET-A' }]); await old;
  assert.equal(c.state.verified, false); assert.deepEqual(c.state.codes, []); assert.equal(c.state.phase, 'otp');
});
test('late quote A cannot replace B, and destroy discards pending responses/private state', async () => {
  const h = setup(), a = deferred(), b = deferred(); let n = 0;
  h.adapter.preview = () => (++n === 1 ? a.promise : b.promise);
  const c = h.create(), first = c.preview(); c.setPhone('09123456789'); const second = c.preview();
  const bill = { quote_id: 'B', currency: 'IRT', total_amount: 100, discount_amount: 0, tax_amount: 0, shipping_cost: 0, payment_amount: 100 };
  b.resolve(bill); await second; a.resolve({ ...bill, quote_id: 'A' }); await first; assert.equal(c.state.bill.quote_id, 'B');
  c.destroy(); assert.equal(c.state.phone, ''); assert.deepEqual(c.state.codes, []);
});
test('challenge expiry, resend cooldown, wrong code, replay and cross-device use fail server-side', () => {
  const h = setup(), base = { cycle_id: 'customer-cycle-A', mobile: '09123456789' };
  const call = (op, body = base, device = h.device) => h.server.handle('POST', ROOT + op, body, device);
  const response = call('challenge'); assert.equal(response.body.verify_code, undefined); assert.equal(response.body.is_new_user, undefined);
  assert.equal(call('challenge').status, 429);
  const verify = { ...base, challenge_id: response.body.challenge_id, code: '246810' };
  assert.equal(call('verify', verify, { token: 'other-device' }).status, 400);
  assert.equal(call('verify', { ...verify, code: '000000' }).status, 400);
  assert.equal(call('verify', verify).status, 200); assert.equal(call('verify', verify).status, 400);
  h.advance(120000); const next = call('challenge'); h.advance(120000);
  assert.equal(call('verify', { ...verify, challenge_id: next.body.challenge_id }).status, 400);
});
test('revoked cycle cannot be resurrected by delayed challenge/verify or raw phone discounts', () => {
  const h = setup(), body = { cycle_id: 'revoked-cycle', mobile: '09123456789' };
  assert.equal(h.server.handle('POST', ROOT + 'discounts', body, h.device).status, 403);
  h.server.handle('POST', ROOT + 'revoke', body, h.device);
  assert.equal(h.server.handle('POST', ROOT + 'challenge', body, h.device).status, 403);
  assert.equal(h.server.handle('POST', ROOT + 'challenge', body, null).status, 403);
});
test('lost confirmation response retries identical key/body; cancel/double submit cannot race it', async () => {
  const h = setup(), c = await prepared(h), original = h.adapter.confirmCard, pending = deferred();
  const received = []; h.adapter.confirmCard = async body => { received.push(body); const result = await original(body); if (received.length === 1) { await pending.promise; } return result; };
  c.openCard(); h.advance(30000); const first = c.confirmCard(); await Promise.resolve();
  assert.equal(await c.cancel(), false); assert.equal(await c.confirmCard(), false); c.edit(); assert.equal(c.state.phase, 'checkout');
  pending.reject(Error('lost response')); await first; assert.equal(c.state.unresolved, true); assert.equal(h.completions.length, 0);
  assert.equal(await c.retry(), true); assert.deepEqual(received[0], received[1]); assert.equal(h.completions.length, 1);
});
test('invalid amount or fake paid result never clears basket or reports completion', async () => {
  for (const patch of [{ payment_amount: 0 }, { state: 'paid' }, { customer_bound: false }]) {
    const h = setup(), c = await prepared(h), original = h.adapter.confirmCard;
    h.adapter.confirmCard = async body => ({ ...await original(body), ...patch }); c.openCard(); h.advance(30000);
    assert.equal(await c.confirmCard(), false); assert.equal(h.completions.length, 0); assert.equal(c.state.items[0].count, 1);
  }
  assert.equal(validBill({ quote_id: 'x', currency: 'IRT', total_amount: NaN }), false);
});
test('online disconnected reports unavailable without redirect/paid claim; isolated fixture redirects only to allowed URL', async () => {
  const h = setup(), c = await prepared(h); assert.equal(await c.online(), false); assert.match(c.state.error, /اتصال/); assert.deepEqual(h.redirects, []); assert.equal(c.state.unresolved, false);
  const f = setup({ gatewayFixture: true, returnOrigin: 'http://127.0.0.1:3998' }), online = await prepared(f);
  assert.equal(await online.online(), true); assert.equal(f.redirects.length, 1); assert.ok(f.redirects[0].includes(ROOT + 'gateway/'));
  assert.equal(f.completions.length, 0); assert.equal(online.state.result, null);
  for (const url of ['javascript:alert(1)', 'http://evil.test/pay', 'https://user:pass@gateway.test/pay']) assert.equal(gatewayUrl(url, false), null);
  assert.equal(gatewayUrl('http://localhost:3999/not-a-gateway', true, 'http://localhost:3999'), null);
});
test('transport prevents production/changed-device calls and performs no generic login', async () => {
  let enabled = false, token = 'A', calls = 0;
  const args = { dev: true, pageOrigin: 'http://localhost:3333', allowed: () => enabled, owner: () => token, axios: { defaults: { baseURL: 'http://localhost:3999' }, post: async () => { calls++; return { data: [] }; } } };
  await assert.rejects(createLocalAdapter(args).challenge({})); assert.equal(calls, 0);
  enabled = true; const adapter = createLocalAdapter(args); token = 'B'; await assert.rejects(adapter.discounts({})); assert.equal(calls, 0);
});
test('cancel retry is idempotent, conflicting confirm/second key cannot consume the quote, and cleanup retains reconciliation', async () => {
  const h = setup(), c = await prepared(h), original = h.adapter.cancel;
  let tries = 0; h.adapter.cancel = async body => { const result = await original(body); if (++tries === 1) throw Error('response lost'); return result; };
  c.openCard(); h.advance(30000); assert.equal(await c.cancel(), false);
  assert.equal(await c.confirmCard(), false); assert.equal(await c.retry(), true);
  const body = h.calls.find(call => call.method === 'cancel').body;
  assert.equal(h.server.handle('POST', ROOT + 'cancel', body, h.device).body.state, 'cancelled');
  assert.equal(h.server.handle('POST', ROOT + 'confirmCard', body, h.device).status, 409);
  assert.equal(h.server.handle('POST', ROOT + 'confirmCard', { ...body, attempt_id: 'another-attempt' }, h.device).status, 403);
  assert.equal(h.server.handle('POST', ROOT + 'reconcile', { cycle_id: body.cycle_id, attempt_id: body.attempt_id }, h.device).body.state, 'cancelled');
  assert.equal(h.server.handle('POST', ROOT + 'reconcile', { cycle_id: body.cycle_id, attempt_id: body.attempt_id }, { token: 'other-device' }).status, 404);
  assert.equal(h.completions.length, 1);
});
