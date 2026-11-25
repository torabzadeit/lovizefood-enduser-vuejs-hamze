const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRestaurantMock, MOBILE, CUSTOMER_ID, readOrders } = require('../dev-mock/restaurant-mock.cjs');
const { localMockAllowed, verifiedMockScope, verifiedMockBill } = require('../utils/mockRestaurant.cjs');
const sample = require('../dev-mock/sample-data.json');
const core = require('../dev-mock/mock-core');
const product = sample.responses['GET /api/enduser/core/initialize'].body.products.find(item => !item.isOutOfStock && item.add_unit > 0);
const createPath = '/api/enduser/order/create';
const sessionPath = '/api/enduser/mock/restaurant/session';
const payload = (key = 'mock-test-0001') => ({ delivery_type: 'inRestaurant', products: [{ product_id: product.key, count: product.add_unit }], idempotency_key: key });
function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lovize-restaurant-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'orders.json');
  return { mock: createRestaurantMock(sample, { recordFile: file, ...options }), file };
}
function login(mock) {
  mock.handle('POST', '/api/auth/check-mobile', { mobile: MOBILE });
  const result = mock.handle('POST', '/api/auth/login', { mobile: MOBILE, verify_code: '12345' });
  assert.equal(result.status, 200);
  return { authorization: 'Bearer ' + result.body.token };
}

test('scope requires the exact synthetic number and a consumed, unexpired verification challenge', t => {
  let clock = Date.now();
  const { mock } = fixture(t, { now: () => clock });
  assert.equal(mock.handle('POST', '/api/auth/login', { mobile: MOBILE, verify_code: '12345' }).status, 400);
  for (const mobile of ['09120000000', '09000000002', ' 09000000001', '۰۹۰۰۰۰۰۰۰۰۱']) {
    const input = { mobile, verify_code: '12345', scopes: ['restaurant:mock'] };
    const response = mock.handle('POST', '/api/auth/login', input) || core(sample).handle('POST', '/api/auth/login', input);
    assert.ok(!response.body.user.scopes);
    assert.equal(mock.handle('GET', sessionPath, {}, { authorization: 'Bearer ' + response.body.token }).body.scope, null);
  }
  mock.handle('POST', '/api/auth/check-mobile', { mobile: MOBILE });
  assert.equal(mock.handle('POST', '/api/auth/login', { mobile: MOBILE, verify_code: 'wrong' }).status, 400);
  assert.equal(mock.handle('POST', '/api/auth/register', { mobile: MOBILE, verify_code: '12345' }).status, 400);
  clock += 5 * 60 * 1000;
  assert.equal(mock.handle('POST', '/api/auth/login', { mobile: MOBILE, verify_code: '12345' }).status, 400);
  const headers = login(mock);
  assert.equal(mock.handle('GET', sessionPath, {}, headers).body.scope, 'restaurant:mock');
  assert.equal(mock.handle('POST', '/api/auth/login', { mobile: MOBILE, verify_code: '12345' }).status, 400);
  clock += 8 * 60 * 60 * 1000;
  assert.equal(mock.handle('POST', createPath, payload(), headers).status, 403);
});

test('anonymous, ordinary, forged and revoked sessions cannot submit or preview inRestaurant', t => {
  const { mock } = fixture(t);
  for (const headers of [{}, { authorization: 'Bearer mock-token' }, { authorization: 'Bearer mock-restaurant-forged', scopes: 'restaurant:mock' }]) {
    assert.equal(mock.handle('POST', createPath, payload(), headers).status, 403);
    assert.equal(mock.handle('POST', '/api/enduser/order/preview', payload(), headers).status, 403);
  }
  const headers = login(mock);
  assert.equal(mock.handle('DELETE', sessionPath, {}, headers).status, 200);
  assert.equal(mock.handle('POST', createPath, payload(), headers).status, 403);
  assert.equal(mock.handle('GET', sessionPath, {}, headers).body.scope, null);
});

test('server validates products, quantities, classification, personal data and monetary input', t => {
  const { mock, file } = fixture(t);
  const headers = login(mock);
  for (const invalid of [null, [], { ...payload(), delivery_type: 'sendToMe' }, { ...payload(), discount_code: 'FRIDAY100' },
    { ...payload(), payment_amount: 0 }, { ...payload(), customer_mobile: MOBILE }, { ...payload(), products: [] },
    { ...payload(), products: [{ product_id: 'missing', count: 1 }] },
    ...[0, -1, true, '1', Infinity, 101, product.add_unit / 3].map(count => ({ ...payload(), products: [{ product_id: product.key, count }] })),
    { ...payload(), products: [...payload().products, ...payload().products] }, { ...payload(), idempotency_key: '../invalid' }]) {
    assert.equal(mock.handle('POST', createPath, invalid, headers).status, 400, JSON.stringify(invalid));
  }
  assert.equal(fs.existsSync(file), false);
});

test('creation persists an unpaid classified order, prices server-side and retries once', t => {
  const { mock, file } = fixture(t);
  const headers = login(mock);
  const quote = mock.handle('POST', '/api/enduser/order/preview', payload(), headers);
  const created = mock.handle('POST', createPath, payload(), headers);
  assert.equal(created.status, 201);
  assert.equal(created.body.deliveryType, 'inRestaurant');
  assert.equal(created.body.payment_amount, quote.body.payment_amount);
  const rows = readOrders(file);
  assert.equal(rows.length, 1); assert.equal(rows[0].payedAmount, 0); assert.equal(rows[0].paymentStatus, 'mock_unpaid');
  assert.equal(rows[0].items[0].title, product.name);
  assert.equal(rows[0].totalAmount, quote.body.payment_amount * 10);
  assert.equal(fs.readFileSync(file, 'utf8').includes(headers.authorization.slice(7)), false, 'No bearer token on disk');
  assert.deepEqual(mock.handle('POST', createPath, payload(), headers).body, created.body);
  assert.equal(mock.handle('POST', createPath, { ...payload(), products: [{ product_id: product.key, count: product.add_unit * 2 }] }, headers).status, 409);
  assert.equal(readOrders(file).length, 1);
  assert.equal(mock.handle('POST', createPath, payload(), login(mock)).status, 201, 'Separate session does not inherit the previous identity');
});

test('a storage failure never acknowledges a successful order', t => {
  const { mock } = fixture(t, { recordFile: __filename });
  assert.equal(mock.handle('POST', createPath, payload(), login(mock)).status, 503);
});

test('device scope exposes public catalog only, never ordinary customer data or personal discounts', t => {
  const { mock } = fixture(t);
  const headers = login(mock);
  const catalog = mock.handle('GET', '/api/enduser/core/initialize', {}, headers).body;
  assert.deepEqual(Object.keys(catalog).sort(), ['categories', 'products', 'taxEnabled', 'taxPercent'].sort());
  assert.ok(catalog.products.length);
  for (const route of ['/api/enduser/profile', '/api/enduser/profile/addresses', '/api/enduser/profile/active-discount-codes',
    '/api/enduser/profile/orders', '/api/enduser/core/check-discount-code/FRIDAY100']) {
    assert.equal(mock.handle('GET', route, { mobile: MOBILE }, headers).status, 403);
    assert.equal(mock.handle('GET', route, {}, { authorization: 'Bearer mock-token' }), null, 'Ordinary mock flow is unchanged');
  }
  mock.handle('DELETE', sessionPath, {}, headers);
  assert.equal(mock.handle('GET', '/api/enduser/core/initialize', {}, headers).status, 403);
});

test('client rejects shipping, personal discounts and invalid numeric bills', () => {
  const bill = { mockOnly: true, total_amount: 100, discount_amount: 0, shipping_cost: 0, tax_amount: 9, payment_amount: 109 };
  assert.equal(verifiedMockBill(bill), true);
  for (const patch of [{ mockOnly: false }, { shipping_cost: 1 }, { discount_amount: 10 }, { total_amount: '100' },
    { payment_amount: NaN }, { tax_amount: -1 }, { payment_amount: 110 }, { payment_amount: Infinity }]) {
    assert.equal(verifiedMockBill({ ...bill, ...patch }), false);
  }
});

test('frontend permits loopback development only and requires a server scope marker', () => {
  assert.equal(localMockAllowed(true, 'http://localhost:3333', 'http://127.0.0.1:3003'), true);
  for (const args of [[false, 'http://localhost', 'http://localhost'], [true, 'https://example.com', 'http://localhost'], [true, 'http://localhost', 'https://example.com'], [true, 'http://localhost.evil.test', 'http://127.0.0.1'], [true, 'file:///tmp/x', 'http://localhost']]) assert.equal(localMockAllowed(...args), false);
  assert.equal(verifiedMockScope({ mockOnly: true, scope: 'restaurant:mock' }), true);
  assert.equal(verifiedMockScope({ mockOnly: true, user: { scopes: ['restaurant:mock'] } }), false);
});

const freePort = () => new Promise(resolve => {
  const listener = net.createServer(); listener.listen(0, '127.0.0.1', () => { const port = listener.address().port; listener.close(() => resolve(port)); });
});
async function start(t, root, script, env) {
  const child = spawn(process.execPath, [script], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  let log = '';
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Mock start timeout: ' + log)), 15000);
    child.stdout.on('data', data => { log += data; if (log.includes('api on http')) { clearTimeout(timeout); resolve(); } });
    child.stderr.on('data', data => { log += data; });
    child.once('exit', code => { clearTimeout(timeout); reject(Error('Mock exited ' + code + ': ' + log)); });
  });
}

test('isolated HTTP customer submission reaches admin list, details and customer history', async t => {
  const { file } = fixture(t);
  const root = path.resolve(__dirname, '..');
  const admin = path.resolve(root, '../lovizefood-admin');
  const customerPort = await freePort(), adminPort = await freePort();
  await start(t, root, 'dev-mock/mock-api.js', { MOCK_PORT: String(customerPort), LOVIZE_RESTAURANT_MOCK_RECORD: file });
  await start(t, admin, 'dev-mock/mock-api.js', { ADMIN_MOCK_PORT: String(adminPort), LOVIZE_RESTAURANT_MOCK_RECORD: file });
  const customer = `http://127.0.0.1:${customerPort}`, panel = `http://127.0.0.1:${adminPort}`;
  const call = async (origin, route, method = 'GET', body, token) => {
    const response = await fetch(origin + route, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await call(customer, createPath, 'POST', payload(), 'mock-token')).status, 403);
  await call(customer, '/api/auth/check-mobile', 'POST', { mobile: MOBILE });
  const auth = await call(customer, '/api/auth/login', 'POST', { mobile: MOBILE, verify_code: '12345' });
  const created = await call(customer, createPath, 'POST', payload(), auth.body.token);
  assert.equal(created.status, 201);
  const customers = await call(panel, '/api/admin/customer/list');
  assert.equal(customers.body.filter(row => row.username === MOBILE).length, 1);
  assert.equal(customers.body.filter(row => row.customerType === 'restaurant_mock').length, 1);
  const list = await call(panel, '/api/admin/report/order/list?time=allOrders&status=active&search=' + MOBILE);
  assert.equal(list.body.length, 1); assert.equal(list.body[0].id, created.body.id);
  assert.equal(list.body[0].deliveryType, 'inRestaurant'); assert.equal(list.body[0].payedAmount, 0);
  assert.ok(!('owner' in list.body[0]));
  const detail = await call(panel, '/api/admin/report/order-details/' + created.body.id);
  assert.equal(detail.body.orderItems[0].title, product.name);
  assert.equal(detail.body.orderDetails.paymentStatus, 'mock_unpaid');
  const history = await call(panel, '/api/admin/customer/' + CUSTOMER_ID + '/orders');
  assert.equal(history.body.items[0].id, created.body.id);
  assert.equal((await call(customer, createPath, 'POST', payload(), auth.body.token)).body.id, created.body.id);
  assert.equal((await call(panel, '/api/admin/report/order/list?time=allOrders&status=all&search=' + MOBILE)).body.length, 1);
  await call(customer, sessionPath, 'DELETE', undefined, auth.body.token);
  assert.equal((await call(customer, createPath, 'POST', payload('after-revoke'), auth.body.token)).status, 403);
});
