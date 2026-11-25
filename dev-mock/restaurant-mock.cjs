// Node-only local proof. Never imported by the customer production bundle.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { createCheckoutMock } = require('./restaurant-checkout.cjs');

const MOBILE = '09000000001';
const SCOPE = 'restaurant:mock';
const CUSTOMER_ID = 'mock-restaurant-customer';
const recordFile = () => process.env.LOVIZE_RESTAURANT_MOCK_RECORD || path.resolve(__dirname, '../.local-dev/restaurant-mock/orders.json');
const json = (body, status = 200) => ({ status, body });

function readOrders(file) {
  try {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.version !== 1 || record.mockOnly !== true || !Array.isArray(record.orders)) throw Error('Invalid mock record');
    return record.orders;
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

function createRestaurantMock(sample, options = {}) {
  const catalog = sample.responses['GET /api/enduser/core/initialize'].body;
  const file = options.recordFile || recordFile();
  const now = options.now || Date.now;
  const checkout = createCheckoutMock(catalog, { now, gatewayFixture: process.env.LOVIZE_CHECKOUT_TEST_GATEWAY === '1', returnOrigin: process.env.LOVIZE_CHECKOUT_RETURN_ORIGIN || '', ...options.checkout });
  const sessions = new Map();
  let challengeUntil = 0;
  const user = { id: CUSTOMER_ID, mobile: MOBILE, first_name: 'حساب رستوران', last_name: 'آزمایشی', mockOnly: true, scopes: [SCOPE] };
  const sessionFor = headers => {
    const match = /^Bearer (.+)$/.exec(String((headers || {}).authorization || (headers || {}).Authorization || ''));
    const token = match && match[1];
    const session = sessions.get(token);
    return session && session.expires > now() ? { token, ...session } : null;
  };
  const forbidden = () => json({ mockOnly: true, message: 'این مسیر فقط برای نشست تأییدشدهٔ آزمایشی رستوران است.' }, 403);

  function quote(body) {
    if (body.delivery_type !== 'inRestaurant' || !Array.isArray(body.products) || !body.products.length || body.products.length > 50) return null;
    if (Object.keys(body).some(key => !['delivery_type', 'products', 'idempotency_key'].includes(key))) return null;
    const seen = new Set();
    const items = [];
    for (const line of body.products) {
      if (!line || Object.keys(line).some(key => !['product_id', 'count'].includes(key)) || typeof line.product_id !== 'string' || seen.has(line.product_id)) return null;
      const product = catalog.products.find(item => item.key === line.product_id);
      const count = line.count;
      if (!product || product.isOutOfStock || typeof count !== 'number' || !Number.isFinite(count) || count <= 0 || count > 100 || !(product.add_unit > 0)) return null;
      if (Math.abs(count / product.add_unit - Math.round(count / product.add_unit)) > 1e-8) return null;
      seen.add(line.product_id);
      const price = Number(product.price) * (1 - (Number(product.discount_percent) || 0) / 100);
      if (!Number.isFinite(price) || price < 0) return null;
      items.push({ productId: product.key, title: product.name, value: count, unit: product.unit_name || 'عدد', orderAmount: Math.round(price * count) * 10 });
    }
    const total = items.reduce((sum, item) => sum + item.orderAmount / 10, 0);
    const tax = catalog.taxEnabled ? Math.round(total * Number(catalog.taxPercent || 0) / 100) : 0;
    return { items, bill: { total_amount: total, discount_amount: 0, shipping_cost: 0, tax_amount: tax, payment_amount: total + tax } };
  }

  // BACKEND: §18 is MOCK ONLY, independent of the real §16 restaurant contract.
  // Only this synthetic mobile can receive scope, after check-mobile + valid OTP.
  function handle(method, pathname, body = {}, headers = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'بدنهٔ درخواست معتبر نیست.' }, 400);
    if (method === 'POST' && pathname === '/api/auth/check-mobile' && body.mobile === MOBILE) {
      challengeUntil = now() + 5 * 60 * 1000;
      return json({ is_new_user: false, verify_code: '12345', mockOnly: true });
    }
    if (method === 'POST' && ['/api/auth/login', '/api/auth/register'].includes(pathname) && body.mobile === MOBILE) {
      if (pathname.endsWith('/register') || challengeUntil <= now() || String(body.verify_code) !== '12345') return json({ message: 'ابتدا کد آزمایشی معتبر را دریافت و تأیید کنید.' }, 400);
      challengeUntil = 0;
      const token = 'mock-restaurant-' + randomUUID();
      sessions.set(token, { expires: now() + 8 * 60 * 60 * 1000 });
      return json({ token, user, mockOnly: true });
    }
    const session = sessionFor(headers);
    const checkoutResponse = checkout.handle(method, pathname, body, session);
    if (checkoutResponse) return checkoutResponse;
    if (pathname === '/api/enduser/mock/restaurant/session') {
      if (method === 'GET') return json({ mockOnly: true, scope: session ? SCOPE : null, user: session ? user : null });
      if (method === 'DELETE') { if (!session) return forbidden(); sessions.delete(session.token); return json({ mockOnly: true, ok: true }); }
    }
    // BACKEND: §18 device scope has no diner identity or personal-customer privilege.
    // Invalid/revoked device credentials must not fall through to permissive demo routes.
    const deviceCredential = /^Bearer mock-restaurant-/.test(String(headers.authorization || headers.Authorization || ''));
    if (deviceCredential && pathname.startsWith('/api/enduser/') && !['/api/enduser/order/preview', '/api/enduser/order/create'].includes(pathname)) {
      if (!session) return forbidden();
      if (method === 'GET' && pathname === '/api/enduser/core/initialize') {
        const { products, categories, taxEnabled, taxPercent } = catalog;
        return json({ products, categories, taxEnabled, taxPercent });
      }
      return forbidden();
    }
    if (method !== 'POST' || !['/api/enduser/order/preview', '/api/enduser/order/create'].includes(pathname)) return null;
    if (body.delivery_type !== 'inRestaurant' && !session) return null;
    if (!session) return forbidden();
    const priced = quote(body);
    if (!priced) return json({ message: 'اقلام یا نوع سفارش آزمایشی معتبر نیست.' }, 400);
    if (pathname.endsWith('/preview')) return json({ ...priced.bill, mockOnly: true, delivery_type: 'inRestaurant' });
    if (typeof body.idempotency_key !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(body.idempotency_key)) return json({ message: 'شناسهٔ ثبت سفارش لازم است.' }, 400);
    try {
      const owner = createHash('sha256').update(session.token).digest('hex');
      const request = JSON.stringify(body.products.map(line => [line.product_id, line.count]).sort((a, b) => a[0].localeCompare(b[0])));
      const orders = readOrders(file);
      const previous = orders.find(order => order.owner === owner && order.idempotencyKey === body.idempotency_key);
      if (previous) return previous.request === request ? json(previous.result) : json({ message: 'شناسه قبلاً برای اقلام دیگری استفاده شده است.' }, 409);
      const created = new Date(now());
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tehran' }).format(created);
      const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' }).format(created);
      const id = 'mock-restaurant-' + randomUUID();
      const trackingCode = 'MOCK-' + randomUUID().slice(0, 8).toUpperCase();
      const result = { mockOnly: true, id, orderNumber: trackingCode, deliveryType: 'inRestaurant', status: 10, paymentStatus: 'mock_unpaid', ...priced.bill };
      orders.unshift({ id, trackingCode, customerId: CUSTOMER_ID, name: user.first_name, family: user.last_name, username: MOBILE,
        mockOnly: true, mockSource: 'restaurant-customer', deliveryType: 'inRestaurant', deliveryMode: 'asap',
        deliveryDate: date, deliveryTime: time, deliveryAddress: null, createDate: created.toISOString(),
        totalAmount: priced.bill.payment_amount * 10, payedAmount: 0, discountAmount: 0, shippingCost: 0,
        taxAmount: priced.bill.tax_amount, status: 10, paymentStatus: 'mock_unpaid', comment: 'سفارش آزمایشی داخل رستوران؛ بدون پرداخت واقعی',
        items: priced.items, owner, idempotencyKey: body.idempotency_key, request, result });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temporary = file + '.' + process.pid + '.tmp';
      fs.writeFileSync(temporary, JSON.stringify({ version: 1, mockOnly: true, orders }, null, 2), { mode: 0o600 });
      fs.renameSync(temporary, file);
      return json(result, 201);
    } catch (_) { return json({ message: 'ذخیرهٔ سفارش محلی ممکن نشد؛ با همان شناسه دوباره تلاش کنید.' }, 503); }
  }
  return { handle };
}

module.exports = { createRestaurantMock, readOrders, recordFile, MOBILE, SCOPE, CUSTOMER_ID };
