const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Vue = require('vue');
const Vuex = require('vuex');
const adapter = require('../utils/basket.cjs');
const draft = require('../utils/checkoutDraft.cjs');
Vue.use(Vuex);
// Load the actual Nuxt module without a build or a parallel store implementation.
const source = fs.readFileSync(require.resolve('../store/basket.js'), 'utf8')
  .replace("import adapter from '../utils/basket.cjs';", '')
  .replace(/export const /g, 'const ');
const moduleDefinition = new Function('adapter', source + '\nreturn {namespaced,state,getters,mutations,actions};')(adapter);
const product = (key, more = {}) => ({ key, price: 100, add_unit: 0.5, name: key, categoryId: 'daily', ...more });
const catalog = () => ({ products: [product('a'), product('chef', { menu_type: 'specialDay' })],
  categories: [{ id: 'daily', text: 'روزانه' }], taxEnabled: true, taxPercent: 9,
  savedAddresses: [{ address: 'PRIVATE' }], user: { mobile: 'PRIVATE' }, token: 'SECRET' });
function app(get = async () => ({ data: catalog() })) {
  const store = new Vuex.Store({ strict: true, modules: { basket: moduleDefinition } });
  store.$axios = { get };
  return store;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

test('direct-entry bootstrap, categories, image metadata and isolated app state', async () => {
  const first = app(), second = app();
  await first.dispatch('basket/bootstrap');
  first.commit('basket/increment', { key: 'a', steps: 3 });
  assert.equal(first.getters['basket/counts'].a, 1.5);
  assert.deepEqual(second.getters['basket/products'], []);
  assert.deepEqual(first.getters['basket/menuProducts'].map(p => p.key), ['chef', 'a']);
  assert.equal(first.getters['basket/categoryProducts']('__chef_daily__').length, 1);
  assert.equal(first.getters['basket/categoryProducts']('daily', 'missing').length, 0);
  assert.doesNotMatch(JSON.stringify(first.state), /PRIVATE|SECRET|savedAddresses|mobile|token/);
  first.commit('basket/loaded', { ...catalog(), products: [product('a', { thumbnail: '/thumb.jpg', image: 'https://example.invalid/food.jpg' })] });
  const item = first.getters['basket/productData']('http://localhost:3003/').a;
  assert.equal(item.image, 'http://localhost:3003/thumb.jpg');
  assert.equal(item.imageFull, 'https://example.invalid/food.jpg');
  assert.equal(item.count, 1.5);
});

test('response-time reconciliation preserves intervening edits and stale loads cannot replace new catalog', async () => {
  const store = app();
  await store.dispatch('basket/bootstrap');
  const old = deferred(), recent = deferred();
  const queue = [old, recent];
  store.$axios.get = () => queue.shift().promise;
  const older = store.dispatch('basket/bootstrap', { force: true });
  store.commit('basket/increment', { key: 'a', steps: 2 });
  const newer = store.dispatch('basket/bootstrap', { force: true });
  recent.resolve({ data: { ...catalog(), products: [product('a', { price: 200 })] } });
  await newer;
  old.resolve({ data: catalog() });
  assert.equal((await older).applied, false);
  assert.equal(store.getters['basket/counts'].a, 1);
  assert.equal(store.getters['basket/products'][0].price, 200);
  store.$axios.get = async () => { throw Error('offline'); };
  await assert.rejects(store.dispatch('basket/bootstrap', { force: true }), /offline/);
  assert.equal(store.getters['basket/counts'].a, 1);
  store.$axios.get = async () => ({ data: {} });
  await assert.rejects(store.dispatch('basket/bootstrap', { force: true }), /Invalid catalog/);
  assert.equal(store.getters['basket/counts'].a, 1);
});

test('checkout intent is consumed once and story position only contains valid catalog keys', async () => {
  const store = app();
  await store.dispatch('basket/bootstrap');
  await store.dispatch('basket/requestCheckout', { categoryId: 'daily', productKey: 'a', address: 'PRIVATE' });
  assert.deepEqual(store.state.basket.storyPosition, { categoryId: 'daily', productKey: 'a' });
  assert.equal(await store.dispatch('basket/consumeCheckoutIntent'), true);
  assert.equal(await store.dispatch('basket/consumeCheckoutIntent'), false);
  assert.equal(store.state.basket.checkoutIntent, false);
});

test('public estimate and checkout bill share arithmetic without storing personal calculation options', async () => {
  const store = app();
  await store.dispatch('basket/bootstrap');
  store.commit('basket/increment', { key: 'a', steps: 2 });
  assert.equal(store.getters['basket/estimatedBill'].payment_amount, 109);
  const options = { delivery_type: 'sendToMe', shippingCost: 10, taxEnabled: true, taxPercent: 9,
    discountCode: { code: 'PRIVATE-CODE', code_valid_status: true, discount_percent: 10, max_amount: 5 } };
  assert.deepEqual(store.getters['basket/billFor'](options), adapter.calculateBill(store.state.basket.basket, options));
  assert.equal(store.getters['basket/billFor'](options).payment_amount, 115);
  assert.doesNotMatch(JSON.stringify(store.state), /PRIVATE-CODE|discountCode|shippingCost/);
});

test('checkout draft is app/session-bound, one-shot, allowlisted and outside public Vuex state', () => {
  const first = app(), second = app();
  const input = { delivery_address: 'PRIVATE', addressOverridden: true, plaque: '12',
    discountCode: { code: 'PERSONAL', discount_percent: 10 }, token: 'SECRET', bankCardNumber: 'PAN', mobile: 'PHONE' };
  draft.saveCheckoutDraft(first, 'owner-a', input);
  input.discountCode.code = 'changed';
  assert.equal(draft.takeCheckoutDraft(second, 'owner-a'), null);
  const restored = draft.takeCheckoutDraft(first, 'owner-a');
  assert.equal(restored.delivery_address, 'PRIVATE');
  assert.equal(restored.discountCode.code, 'PERSONAL');
  assert.doesNotMatch(JSON.stringify(restored), /SECRET|PAN|PHONE|token|bankCardNumber|mobile/);
  assert.doesNotMatch(JSON.stringify(first.state), /PRIVATE|PERSONAL/);
  assert.equal(draft.takeCheckoutDraft(first, 'owner-a'), null);
  draft.saveCheckoutDraft(first, 'owner-a', input);
  assert.equal(draft.takeCheckoutDraft(first, 'owner-b'), null);
  assert.equal(draft.takeCheckoutDraft(first, 'owner-a'), null);
  draft.saveCheckoutDraft(first, null, input);
  assert.equal(draft.takeCheckoutDraft(first, null).delivery_address, 'PRIVATE');
  draft.saveCheckoutDraft(first, null, input);
  assert.equal(draft.takeCheckoutDraft(first, 'new-login'), null);
  draft.saveCheckoutDraft(first, null, input);
  draft.clearCheckoutDraft(first);
  assert.equal(draft.takeCheckoutDraft(first, null), null, 'logout/account-boundary cleanup also invalidates anonymous drafts');
});

test('category iconKey accepts only the bundled enum and drops HTML, URLs and non-string values', () => {
  const store = app();
  const accepted = ['shish-kebab', 'pizza-slice', 'plate-utensils', 'cup-straw', 'hat-chef', 'pizza', 'sandwich', 'burger', 'bowl-food', 'bottle-water', 'bread-slice', 'pepper-hot'];
  const rejected = [undefined, null, '', 'constructor', '__proto__', 'unknown', '<svg onload=alert(1)>', 'javascript:alert(1)', 'data:image/svg+xml,x', 'https://example.invalid/icon.svg', { iconKey: 'pizza' }, 1];
  store.commit('basket/loaded', { ...catalog(), categories: [...accepted, ...rejected].map((iconKey, index) => ({ id: String(index), text: 'دسته', iconKey })) });
  assert.deepEqual(store.state.basket.categories.slice(0, accepted.length).map(c => c.iconKey), accepted);
  assert.ok(store.state.basket.categories.slice(accepted.length).every(c => c.iconKey === null));
  assert.doesNotMatch(JSON.stringify(store.state), /onload|javascript:|example.invalid|data:image/);
});
