const test = require('node:test');
const assert = require('node:assert/strict');
const { createCheckout } = require('../utils/restaurantCheckout.cjs');
const { createLocalAdapter } = require('../utils/restaurantCheckoutAdapter.cjs');
const { createCheckoutMock, ROOT } = require('../dev-mock/restaurant-checkout.cjs');
const { RESTAURANT_TEST_OTP } = require('../utils/restaurantOtpFixture.cjs');
const items = [{ key: 'food', price: 100000, add_unit: 1, count: 1 }];
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(config = {}) {
  let time = 1000, seq = 0, enabled = true, owner = 'device-A';
  const calls = [], server = createCheckoutMock({ products: items }, { now: () => time });
  const axios = { defaults: { baseURL: 'http://127.0.0.1:3003' }, post: async (url, body) => {
    calls.push({ operation: url.slice(ROOT.length), body });
    const response = server.handle('POST', url, body, { token: owner });
    if (response.status >= 400) throw Error('HTTP ' + response.status);
    return { data: response.body };
  } };
  const args = { axios, allowed: () => enabled, owner: () => owner, dev: true, pageOrigin: 'http://localhost:3333', ...config };
  const adapter = createLocalAdapter(args);
  const create = (custom = adapter) => createCheckout({ adapter: custom, items, now: () => time, id: () => 'test-cycle-' + ++seq });
  return { adapter, args, calls, create, advance: ms => { time += ms; }, disable: () => { enabled = false; }, changeOwner: () => { owner = 'device-B'; } };
}
async function open(h, adapter) {
  const c = h.create(adapter); c.setPhone('09123456789'); await c.preview(); await c.viewDiscounts(); return c;
}
const privateEmpty = c => { assert.equal(c.state.verified, false); assert.deepEqual(c.state.codes, []); assert.equal(c.state.identifying, false); };
test('explicit development/loopback adapter prefills the actual fixture and waits for normal verification', async () => {
  const h = setup(), c = await open(h);
  assert.equal(c.state.otp, RESTAURANT_TEST_OTP);
  assert.equal(h.calls.some(c => c.operation === 'verify' || c.operation === 'discounts'), false);
  const challenge = h.calls.find(c => c.operation === 'challenge');
  assert.equal(challenge.body.code, undefined);
  assert.equal(await c.verify(), true); assert.equal(c.state.codes[0].code, 'PERSONAL10');
  c.closeOtp(); assert.equal(c.state.verified, true, 'post-success modal hide must preserve success');
});
test('generic/standalone adapter never prefills, including a forged response test_code', async () => {
  const h = setup(), generic = { ...h.adapter, localOnly: false };
  const original = generic.challenge;
  generic.challenge = async body => ({ ...await original(body), test_code: RESTAURANT_TEST_OTP });
  const c = await open(h, generic); assert.equal(c.state.otp, '');
  const localWithoutCapability = { ...h.adapter }; delete localWithoutCapability.otpPrefill;
  const other = await open(h, localWithoutCapability); assert.equal(other.state.otp, '');
});
for (const config of [
  { dev: false }, { dev: undefined }, { pageOrigin: 'https://restaurant.example' },
  { axios: { defaults: { baseURL: 'https://api.example' } } },
]) test('nonlocal/dev-false adapter has no prefill or transport: ' + JSON.stringify(config), async () => {
  const h = setup(config), c = await open(h);
  assert.equal(h.adapter.otpPrefill, undefined); assert.equal(c.state.otp, '');
  assert.equal(h.calls.length, 0); privateEmpty(c);
});
test('prefill capability checks current owner, allow gate and mock delivery marker', () => {
  const h = setup(), fixture = { mockOnly: true, delivery: 'local_fixture' };
  assert.equal(h.adapter.otpPrefill({}), '');
  assert.equal(h.adapter.otpPrefill({ ...fixture, mockOnly: false }), '');
  assert.equal(h.adapter.otpPrefill(fixture), RESTAURANT_TEST_OTP);
  h.changeOwner(); assert.equal(h.adapter.otpPrefill(fixture), '');
  const disabled = setup(); disabled.disable(); assert.equal(disabled.adapter.otpPrefill(fixture), '');
});
test('prefill does not bypass wrong/expired code or expose any code in the challenge response', async () => {
  const h = setup(), result = await h.adapter.challenge({ cycle_id: 'raw-challenge', mobile: '09123456789' });
  assert.deepEqual(Object.keys(result).sort(), ['challenge_id', 'delivery', 'expires_in', 'mockOnly', 'retry_after'].sort());
  const c = await open(h); c.state.otp = '000000';
  assert.equal(await c.verify(), false); privateEmpty(c);
  c.state.otp = RESTAURANT_TEST_OTP; h.advance(120000);
  assert.equal(await c.verify(), false); privateEmpty(c); assert.equal(c.state.phase, 'otp');
});
test('idle dismiss keeps draft and cooldown, reopens locally prefilled, and cannot verify while closed', async () => {
  const h = setup(), c = await open(h); c.state.codeInput = 'DRAFT';
  const saved = JSON.stringify({ items: c.state.items, bill: c.state.bill, phone: c.state.phone, fulfilment: c.state.fulfilment, input: c.state.codeInput });
  c.closeOtp(); assert.equal(c.state.otp, ''); assert.equal(await c.verify(), false);
  assert.equal(JSON.stringify({ items: c.state.items, bill: c.state.bill, phone: c.state.phone, fulfilment: c.state.fulfilment, input: c.state.codeInput }), saved);
  await c.viewDiscounts(); assert.equal(c.state.otp, RESTAURANT_TEST_OTP);
  assert.equal(h.calls.filter(x => x.operation === 'challenge').length, 1);
});
test('a discount fetch can still retry after consuming OTP without submitting the one-time code twice', async () => {
  const h = setup(), c = await open(h), original = h.adapter.discounts;
  h.adapter.discounts = async () => { throw Error('temporary outage'); };
  assert.equal(await c.verify(), false);
  h.adapter.discounts = original;
  assert.equal(await c.verify(), true);
  assert.equal(h.calls.filter(x => x.operation === 'verify').length, 1);
});
for (const operation of ['challenge', 'verify', 'discounts']) test('dismiss discards delayed ' + operation + ' and safely reopens a new cycle', async () => {
  const h = setup(), late = deferred(), original = h.adapter[operation];
  let response, started = false;
  h.adapter[operation] = async body => { response = await original(body); started = true; await late.promise; return response; };
  const c = h.create(); c.setPhone('09123456789'); await c.preview(); c.state.codeInput = 'DRAFT';
  const request = operation === 'challenge' ? c.viewDiscounts() : (await c.viewDiscounts(), c.verify());
  while (!started) await new Promise(resolve => setImmediate(resolve));
  c.closeOtp(); privateEmpty(c); assert.equal(c.state.phase, 'checkout'); assert.equal(c.state.otp, '');
  h.adapter[operation] = original;
  await c.viewDiscounts(); assert.equal(c.state.otp, RESTAURANT_TEST_OTP);
  late.resolve(); assert.equal(await request, false);
  assert.equal(c.state.phase, 'otp'); privateEmpty(c);
  assert.equal(c.state.codeInput, 'DRAFT'); assert.equal(c.state.phone, '09123456789');
  assert.equal(await c.verify(), true); assert.equal(c.state.codes.length, 1);
});
