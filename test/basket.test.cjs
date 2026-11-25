const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const basket = require('../utils/basket.cjs');
const page = fs.readFileSync(path.join(__dirname, 'fixtures/basket-legacy-index.txt'), 'utf8');

// Execute the frozen pre-WIRE Vue method bodies as the compatibility oracle.
// No copied reference implementation of price/tax/discount formulas.
function legacyMethod(name, dependencies = {}) {
  const source = name === 'selectedProducts' ? page.slice(page.indexOf('\n  computed:')) : page;
  const match = source.match(new RegExp(`^    ${name}\\(([^)]*)\\) \\{([\\s\\S]*?)^    \\},?`, 'm'));
  assert.ok(match, `current index.vue still contains ${name}`);
  return new Function(...Object.keys(dependencies), `return function(${match[1]}) {${match[2]}}`)(...Object.values(dependencies));
}
const legacyBill = legacyMethod('calcBill');
const legacyLines = legacyMethod('selectedProducts');
const food = (key, overrides = {}) => ({
  key, name: `food-${key}`, price: 101, add_unit: 1, discount_percent: 0,
  isOutOfStock: false, menu_type: 'daily', unit_name: 'عدد', ...overrides,
});
function legacyContext(products, counts, options = {}) {
  return {
    products, productData: Object.fromEntries(products.map(p => [p.key, { ...p, count: counts[p.key] || 0 }])),
    bill: {}, delivery_type: 'iWillCome', shippingCost: 0, taxEnabled: false, taxPercent: 0,
    discountCode: {}, ...options,
    $set: (object, key, value) => { object[key] = value; },
    calcBill() { legacyBill.call(this); },
  };
}
function populated(products, counts) {
  return Object.entries(counts).reduce((state, [key, count]) => basket.setCount(state, key, count), basket.createBasket(products));
}
function deepFreeze(object) {
  for (const value of Object.values(object)) if (value && typeof value === 'object') deepFreeze(value);
  return Object.freeze(object);
}

test('billing preserves independently pinned totals and matches the actual checkout', () => {
  const products = [food('a'), food('b', { price: 50, add_unit: 0.5 })];
  const counts = { a: 2, b: 0.5 };
  const options = {
    delivery_type: 'sendToMe', shippingCost: 17, taxEnabled: true, taxPercent: 9,
    discountCode: { code_valid_status: true, discount_percent: 15, max_amount: 30 },
  };
  const expected = { total_amount: 227, shipping_amount: 17, tax_amount: 22, discount_amount: 30, payment_amount: 236 };
  const context = legacyContext(products, counts, options);
  legacyBill.call(context);
  assert.deepEqual(context.bill, expected);
  assert.deepEqual(basket.calculateBill(populated(products, counts), options), expected);
});

test('delivery/tax/discount matrix stays equal to checkout (including its unusual cases)', () => {
  const products = [food('a', { price: '333', discount_percent: 20, add_unit: 0.25 }), food('b', { price: 19 })];
  const counts = { a: 1.25, b: 2 };
  const state = populated(products, counts);
  const discounts = [
    {}, { code_valid_status: false, discount_percent: 80 },
    { code_valid_status: true, discount_percent: 12.5, max_amount: 0 },
    { code_valid_status: true, discount_percent: 12.5, max_amount: 20 },
    { code_valid_status: true, discount_percent: 200, max_amount: 0 },
  ];
  for (const delivery_type of ['sendToMe', 'iWillCome', 'snapp']) {
    for (const tax of [{ taxEnabled: false, taxPercent: 9 }, { taxEnabled: true, taxPercent: 9 }, { taxEnabled: true, taxPercent: 0 }]) {
      for (const discountCode of discounts) {
        const options = { delivery_type, shippingCost: '23', ...tax, discountCode };
        const context = legacyContext(products, counts, options);
        legacyBill.call(context);
        assert.deepEqual(basket.calculateBill(state, options), context.bill);
      }
    }
  }
  assert.deepEqual(basket.calculateBill(basket.createBasket(products), { delivery_type: 'sendToMe', shippingCost: 100 }), {
    total_amount: 0, shipping_amount: 0, tax_amount: 0, discount_amount: 0, payment_amount: 0,
  });
});

test('exposes the existing product-discount discrepancy instead of silently repricing', () => {
  const products = [food('a', { price: 100, discount_percent: 25 })];
  const state = populated(products, { a: 2 });
  const lines = basket.selectedProducts(state);
  assert.deepEqual(lines, legacyLines.call(legacyContext(products, { a: 2 })));
  assert.equal(lines[0].total, 200);
  assert.equal(lines[0].totalWithDiscount, 150);
  assert.equal(basket.calculateBill(state).payment_amount, 200, 'legacy checkout uses the raw total');
  assert.notEqual(basket.calculateBill(state).payment_amount, lines[0].totalWithDiscount);
});

test('canonicalizes numeric keys, deduplicates and safely handles prototype-like keys', () => {
  let state = basket.createBasket([food(0), food(7), food('7', { price: 999 }), food('__proto__'), food('constructor'), food(null)]);
  assert.deepEqual(state.products.map(p => p.key), ['0', '7', '__proto__', 'constructor']);
  assert.ok(state.issues.some(i => i.reason === 'duplicate-key'));
  assert.ok(state.issues.some(i => i.reason === 'invalid-key'));
  for (const key of [0, ' 7 ', '__proto__', 'constructor']) state = basket.increment(state, key);
  assert.deepEqual(basket.orderProducts(state), ['0', '7', '__proto__', 'constructor'].map(product_id => ({ product_id, count: 1 })));
  assert.equal(Object.getPrototypeOf(state.counts), null);
  assert.equal({}.polluted, undefined);
});

test('increments by the catalog unit and supports repeated and multi-step additions', () => {
  let state = basket.createBasket([food('whole'), food('half', { add_unit: 0.5 }), food('quarter', { add_unit: '0.25' })]);
  state = basket.increment(state, 'whole', { steps: 3 });
  state = basket.increment(state, 'half');
  state = basket.increment(state, 'half', { steps: 3 });
  state = basket.increment(state, 'quarter', { steps: 5 });
  assert.deepEqual({ ...state.counts }, { whole: 3, half: 2, quarter: 1.25 });
  state = basket.decrement(state, 'quarter', { steps: 2 });
  assert.equal(state.counts.quarter, 0.75);
  const context = legacyContext([food('half', { add_unit: 0.5 })], { half: 0 });
  context.delivery_date = -1;
  legacyMethod('addProductCount').call(context, 'half', 0.5);
  assert.equal(context.productData.half.count, basket.increment(basket.createBasket(context.products), 'half').counts.half);
});

test('decrement never underflows, characterizing the legacy mismatched-unit defect', () => {
  const products = [food('a')];
  const old = legacyContext(products, { a: 0.5 });
  old.calcBill = () => {};
  legacyMethod('subProductCount').call(old, 'a', 1);
  assert.equal(old.productData.a.count, -0.5, 'known legacy defect: historical quantity smaller than current unit');
  let state = basket.decrement(populated(products, { a: 0.5 }), 'a');
  assert.equal(state.counts.a, 0);
  state = basket.decrement(state, 'a');
  assert.equal(state.counts.a, 0);
  assert.deepEqual(basket.orderProducts(state), []);
  state = basket.increment(basket.createBasket([food('decimal', { add_unit: 0.1 })]), 'decimal', { steps: 3 });
  assert.equal(state.counts.decimal, 0.3);
  for (let i = 0; i < 3; i++) state = basket.decrement(state, 'decimal');
  assert.equal(state.counts.decimal, 0, 'no phantom fractional order line after removing all units');
});

test('invalid units, quantities, step counts and missing products cannot create order lines', () => {
  for (const add_unit of [0, -1, NaN, Infinity, undefined]) {
    const state = basket.createBasket([food('bad', { add_unit })]);
    assert.equal(basket.increment(state, 'bad').issues[0].reason, 'invalid-unit');
    assert.equal(basket.setCount(state, 'bad', 1).issues[0].reason, 'invalid-unit');
    assert.deepEqual(basket.orderProducts(state), []);
  }
  const state = basket.createBasket([food('a')]);
  for (const count of [-1, NaN, Infinity, 1e30, '1']) assert.equal(basket.setCount(state, 'a', count).issues[0].reason, 'invalid-count');
  for (const steps of [0, -1, 0.5, Infinity, '2']) assert.equal(basket.increment(state, 'a', { steps }).issues[0].reason, 'invalid-unit');
  assert.equal(basket.increment(state, 'gone').issues[0].reason, 'missing-product');
  assert.equal(basket.createBasket([food('bad', { price: NaN })]).issues[0].reason, 'invalid-price');
});

test('special-day foods can be added before date choice; a selected disallowed day blocks additions', () => {
  const products = [food('special', { menu_type: 'specialDay', isSpecial: true, specialDay: '[0,2]', add_unit: 0.5 })];
  let state = basket.increment(basket.createBasket(products), 'special');
  assert.equal(state.counts.special, 0.5);
  state = basket.increment(state, 'special', { dayIndex: 2 });
  assert.equal(state.counts.special, 1);
  const denied = basket.increment(state, 'special', { dayIndex: 3 });
  assert.equal(denied.counts.special, 1);
  assert.equal(denied.issues[0].reason, 'special-day');
  assert.equal(basket.decrement(denied, 'special', { dayIndex: 3 }).counts.special, 0.5);
  const malformed = basket.createBasket([{ ...products[0], specialDay: '{invalid' }]);
  assert.equal(basket.increment(malformed, 'special', { dayIndex: 2 }).issues[0].reason, 'special-day');
  for (const dayIndex of [2, 3]) {
    let warnings = 0;
    const context = legacyContext(products, { special: 0 });
    Object.assign(context, {
      delivery_date: 0, deliveryItems: [{ date: 'fixture' }],
      getDeliveryItemText: () => '', jalaliDate: () => '', $bvToast: { toast: () => { warnings++; } },
    });
    legacyMethod('addProductCount', { moment: () => ({ day: () => dayIndex - 1 }) }).call(context, 'special', 0.5);
    assert.equal(context.productData.special.count, basket.increment(basket.createBasket(products), 'special', { dayIndex }).counts.special);
    assert.equal(warnings, dayIndex === 3 ? 1 : 0);
  }
});

test('catalog reconciliation retains quantities, refreshes metadata, and reports unavailable selections', () => {
  let state = populated([food('keep'), food('gone'), food('stock'), food('unit', { add_unit: 0.5 })], { keep: 2, gone: 1, stock: 1, unit: 0.5 });
  state = basket.reconcileCatalog(state, [food('keep', { price: 151 }), food('stock', { isOutOfStock: true }), food('unit'), food('new')]);
  assert.deepEqual({ ...state.counts }, { keep: 2, stock: 0, unit: 0.5, new: 0 });
  assert.deepEqual(state.issues.map(i => i.reason).sort(), ['out-of-stock', 'removed', 'unit-changed']);
  assert.equal(basket.selectedProducts(state)[0].total, 302);
  const reinitialized = basket.reconcileCatalog(state, state.products);
  assert.deepEqual(reinitialized.counts, state.counts, 'page remount must not reset selections');
  assert.equal(basket.increment(state, 'stock').issues[0].reason, 'out-of-stock');
  state = basket.reconcileCatalog(state, [...state.products, food('gone')]);
  assert.equal(state.counts.gone, 0, 'a removed item cannot resurrect later');
  assert.deepEqual(basket.orderProducts(state), [{ product_id: 'keep', count: 2 }, { product_id: 'unit', count: 0.5 }]);
});

test('reorder replaces rather than adds, sums duplicate lines, uses current prices and skips unavailable foods', () => {
  const products = [food('a', { price: 200 }), food('b', { name: 'renamed', price: 50 }), food('stock', { isOutOfStock: true })];
  const lines = [
    { productId: 'a', count: 2 }, { productId: 'a', count: 0.5 },
    { productId: 'old-id', title: 'renamed', count: 1 },
    { productId: 'stock', count: 2 }, { productId: 'gone', count: 1 }, { productId: 'a', count: -1 },
  ];
  let state = basket.replaceFromReorder(populated(products, { a: 9 }), lines);
  const old = legacyContext(products, { a: 9 });
  Object.assign(old, { $bvToast: { toast() {} }, $nextTick: fn => fn(), openCart() {} });
  legacyMethod('applyPendingReorder', { takeReorder: () => ({ lines: lines.filter(line => line.count > 0) }) }).call(old);
  assert.deepEqual({ ...state.counts }, Object.fromEntries(products.map(p => [p.key, old.productData[p.key].count])));
  assert.deepEqual({ ...state.counts }, { a: 2.5, b: 1, stock: 0 });
  assert.equal(basket.calculateBill(state).total_amount, 550);
  assert.deepEqual(state.issues.map(i => i.reason), ['out-of-stock', 'missing-product']);
  assert.deepEqual(basket.replaceFromReorder(state, lines).counts, state.counts, 'repeat handoff never doubles quantities');
  assert.equal(basket.replaceFromReorder(state, null), state, 'no pending reorder leaves selections alone');
  state = basket.replaceFromReorder(state, []);
  assert.deepEqual(basket.orderProducts(state), []);
});

test('existing takeReorder consumes once; the adapter stores no delivery/account details', () => {
  const source = fs.readFileSync(path.join(__dirname, '../utils/reorder.js'), 'utf8').replace(/export function /g, 'function ');
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const reorder = new Function('sessionStorage', source + '\nreturn { stashReorder, takeReorder };')(storage);
  assert.equal(reorder.stashReorder({ items: [{ productId: 'a', count: 2 }], deliveryAddress: 'PRIVATE-ADDRESS' }), true);
  const first = reorder.takeReorder();
  assert.equal(first.deliveryAddress, 'PRIVATE-ADDRESS', 'legacy handoff keeps address outside the shared basket');
  const state = basket.replaceFromReorder(basket.createBasket([food('a')]), first.lines);
  assert.equal(reorder.takeReorder(), null);
  assert.equal(basket.replaceFromReorder(state, null), state);
  assert.equal(JSON.stringify(state).includes('PRIVATE-ADDRESS'), false);
});

test('transitions do not mutate inputs, apps stay isolated, and catalog data is allowlisted', () => {
  const products = [food('a', { specialDay: [0, 2], user: { token: 'SECRET' }, mobile: 'PRIVATE', address: 'PRIVATE', bankCardNumber: 'PRIVATE' })];
  const first = deepFreeze(basket.createBasket(deepFreeze(products)));
  const second = basket.createBasket(products);
  const menuState = basket.increment(first, 'a');
  const cartState = menuState; // two consumers read the same app state
  assert.deepEqual(basket.selectedProducts(menuState), basket.selectedProducts(cartState));
  assert.equal(first.counts.a, 0);
  assert.equal(second.counts.a, 0);
  assert.equal(menuState.counts.a, 1);
  assert.notEqual(first.products, second.products);
  assert.notEqual(first.products[0].specialDay, second.products[0].specialDay);
  assert.doesNotMatch(JSON.stringify(menuState), /SECRET|PRIVATE|bankCardNumber|mobile|address|token/);
  assert.deepEqual(basket.orderProducts(menuState), [{ product_id: 'a', count: 1 }]);
  assert.doesNotThrow(() => basket.reconcileCatalog(first, products));
});
