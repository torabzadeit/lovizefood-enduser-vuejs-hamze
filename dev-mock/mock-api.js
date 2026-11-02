#!/usr/bin/env node
/**
 * Local mock of the customer-facing API, served from dev-mock/sample-data.json
 * (a read-only snapshot of the public GET /api/enduser/core/initialize).
 *
 * Dev tooling only: nothing in the app imports this, and it is excluded from
 * the Docker build context. Run with `npm run dev:mock`.
 *
 * Not the real backend. Auth accepts any mobile with code 12345; order
 * preview does simple arithmetic; order creation is not supported.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.MOCK_PORT || 3003);
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8'));
const snapshot = sample.responses['GET /api/enduser/core/initialize'].body;
const manifest = (sample.responses['GET /api/enduser/core/manifest.webmanifest'] || {}).body || {};

// The snapshot has fixed dates. Shift them so the first active day is always
// today (Tehran), keeping each day's slots and discounts as captured.
function tehranToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date()).split('-').map(Number);
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}
function initialize() {
  const body = JSON.parse(JSON.stringify(snapshot));
  const days = body.schedule.activeDays;
  days.forEach((d, i) => {
    const t = new Date(tehranToday() + i * 864e5);
    d.date = `${t.getUTCFullYear()}/${t.getUTCMonth() + 1}/${t.getUTCDate()}`;
  });
  return body;
}

const imageIds = new Set();
snapshot.products.forEach((p) => {
  [p.thumbnail, p.image].forEach((x) => { if (x) imageIds.add(x); });
});
const colors = ['#e8a33d', '#c0392b', '#8e5a2b', '#6b8e23', '#d35400', '#7d3c98', '#2e86c1'];
function placeholder(p) {
  const hash = [...p].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const prod = snapshot.products.find((x) => x.thumbnail === p || x.image === p);
  const label = (prod ? prod.name : 'food').replace(/[<&>]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${colors[Math.abs(hash) % colors.length]}"/><text x="300" y="310" font-size="44" fill="#fff" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
}

const user = { id: 'mock-user', first_name: 'کاربر', last_name: 'نمونه', mobile: '09120000000' };
const json = (body, status = 200) => ({ status, body });
const routes = {
  'GET /api/enduser/core/initialize': () => json(initialize()),
  'GET /api/enduser/core/manifest.webmanifest': () => json(manifest),
  'POST /api/auth/check-mobile': () => json({ is_new_user: false, verify_code: '12345' }),
  'POST /api/auth/login': () => json({ token: 'mock-token', user }),
  'POST /api/auth/register': () => json({ token: 'mock-token', user }),
  'GET /api/enduser/profile': () => json(user),
  'PUT /api/enduser/profile': () => json(user),
  'GET /api/enduser/profile/addresses': () => json([]),
  'GET /api/enduser/profile/orders': () => json([]),
  'GET /api/enduser/profile/orders/current': () => json({ order: null, items: [] }),
  'GET /api/enduser/profile/password-status': () => json({ hasPassword: false }),
  'GET /api/enduser/profile/discount-codes': () => json([]),
  'GET /api/enduser/profile/active-discount-codes': () => json([]),
  'GET /api/enduser/profile/notifications': () => json([]),
  'PUT /api/enduser/profile/notifications/seen': () => json({ ok: true }),
  'POST /api/enduser/order/preview': (body) => {
    let total = 0;
    (body.products || []).forEach((i) => {
      const p = snapshot.products.find((x) => x.key === i.product_id);
      if (p) total += p.price * (1 - (p.discount_percent || 0) / 100) * i.count;
    });
    total = Math.round(total);
    const shipping = body.delivery_type === 'sendToMe' ? snapshot.shippingCost : 0;
    const tax = snapshot.taxEnabled ? Math.round(total * snapshot.taxPercent / 100) : 0;
    return json({ total_amount: total, discount_amount: 0, shipping_cost: shipping, tax_amount: tax, payment_amount: total + shipping + tax, is_first_order: false });
  },
  'POST /api/enduser/order/create': () => json({ statusCode: 501, message: 'ثبت سفارش در mock پشتیبانی نمی‌شود' }, 501),
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const pathname = new URL(req.url, 'http://x').pathname;

  // Only products that have an image in the snapshot get one; the rest 404 on
  // purpose so the "no photo" state of the UI is exercised with real data.
  if (pathname.startsWith('/public/food/')) {
    if (!imageIds.has(pathname)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return res.end(placeholder(pathname));
  }

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const handler = routes[`${req.method} ${pathname}`];
    console.log(req.method, pathname, handler ? '' : '(not mocked -> 404)');
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ statusCode: 404, message: 'mock: not implemented' }));
    }
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (e) { /* ignore */ }
    const out = handler(body);
    res.writeHead(out.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out.body));
  });
}).listen(PORT, () => console.log(`mock api on http://localhost:${PORT}`));
