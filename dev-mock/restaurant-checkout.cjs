// Isolated development adapter. No SMS, acquiring bank, settlement, real customer
// account or admin record. In-memory state belongs to one mock server instance.
const { randomUUID, createHash } = require('node:crypto');
const { phone } = require('../utils/restaurantCheckout.cjs');
const { RESTAURANT_TEST_OTP } = require('../utils/restaurantOtpFixture.cjs');
const ROOT = '/api/enduser/mock/restaurant/checkout/';
const json = (body, status = 200) => ({ status, body });
const hash = value => createHash('sha256').update(value).digest('hex');
function createCheckoutMock(catalog, { now = Date.now, gatewayFixture = false, returnOrigin = '' } = {}) {
  const cycles = new Map(), quotes = new Map(), attempts = new Map();
  const failure = (message, status = 400) => json({ message, mockOnly: true }, status);
  function handle(method, pathname, body, device) {
    if (!pathname.startsWith(ROOT)) return null;
    const operation = pathname.slice(ROOT.length);
    if (operation.startsWith('gateway/') && method === 'GET') {
      const attempt = attempts.get(operation.slice(8));
      if (!gatewayFixture || !attempt || attempt.result.state !== 'pending_online') return failure('Not found', 404);
      // Dedicated test gateway, never a payment authority. No status query can
      // turn this attempt into paid. Production callbacks must be verified server-side.
      return { status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>Local gateway fixture</title><h1>Local gateway fixture</h1><p>No payment or money transfer occurs here.</p><a href="' + returnOrigin + '/restaurant-mock">Return to restaurant</a>' };
    }
    if (!device) return failure('نشست دستگاه معتبر نیست.', 403);
    if (method !== 'POST' || !body || typeof body.cycle_id !== 'string' || !/^[\w-]{8,100}$/.test(body.cycle_id)) return failure('درخواست معتبر نیست.');
    const owner = hash(device.token), key = owner + ':' + body.cycle_id;
    // A completed attempt remains reconcilable after customer cleanup, using
    // only its device-bound opaque reference, never the customer's phone.
    if (operation === 'reconcile') {
      const saved = attempts.get(body.attempt_id);
      return saved && saved.owner === owner && saved.cycle === key ? json(saved.result) : failure('تلاش یافت نشد.', 404);
    }
    const fingerprint = JSON.stringify({ operation, body });
    if (['confirmCard', 'cancel', 'online'].includes(operation) && attempts.has(body.attempt_id)) {
      const saved = attempts.get(body.attempt_id);
      return saved.owner === owner && saved.cycle === key && saved.fingerprint === fingerprint ? json(saved.result) : failure('شناسه تلاش قبلاً استفاده شده است.', 409);
    }
    if (operation === 'revoke') { cycles.set(key, { revoked: true }); return json({ ok: true, mockOnly: true }); }
    let cycle = cycles.get(key);
    if (cycle && cycle.revoked) return failure('چرخه مشتری پایان یافته است.', 403);
    if (!cycle) { cycle = { mobile: null, verifiedUntil: 0, challenge: null, retryAt: 0, attempts: 0 }; cycles.set(key, cycle); }
    const verified = () => cycle.verifiedUntil > now();
    const codes = () => [{ id: 'personal-' + hash(cycle.mobile).slice(0, 12), code: 'PERSONAL10', title: 'تخفیف ویژه شما', percent: 10, amount: 0, maxAmount: 60000, remainingDays: 6, description: '۱۰ درصد تخفیف تا سقف ۶۰٬۰۰۰ تومان' }];
    if (operation === 'challenge') {
      const mobile = phone(body.mobile);
      if (!mobile) return failure('شماره همراه معتبر نیست.');
      if (now() < cycle.retryAt) return failure('برای ارسال دوباره کمی صبر کنید.', 429);
      cycle.mobile = mobile; cycle.verifiedUntil = 0; cycle.challenge = randomUUID(); cycle.expires = now() + 120000; cycle.retryAt = now() + 120000; cycle.attempts = 0;
      return json({ challenge_id: cycle.challenge, expires_in: 120, retry_after: 120, delivery: 'local_fixture', mockOnly: true });
    }
    if (operation === 'verify') {
      if (!cycle.challenge || cycle.expires <= now() || ++cycle.attempts > 5 || body.challenge_id !== cycle.challenge || String(body.code) !== RESTAURANT_TEST_OTP) return failure('کد معتبر نیست.');
      cycle.challenge = null; cycle.verifiedUntil = now() + 5 * 60000;
      return json({ verified: true, mockOnly: true });
    }
    if (operation === 'discounts') return verified() ? json(codes()) : failure('تأیید شماره همراه لازم است.', 403);
    const requestFingerprint = request => JSON.stringify({ customer_mobile: request.customer_mobile, fulfilment: request.fulfilment, products: request.products, discount_code: request.discount_code || null });
    function price(request) {
      if (!['takeaway', 'dine_in'].includes(request.fulfilment) || !Array.isArray(request.products) || !request.products.length || request.products.length > 50) return null;
      const seen = new Set(); let total = 0;
      for (const line of request.products) {
        const item = catalog.products.find(product => product.key === line.product_id);
        if (!item || seen.has(line.product_id) || item.isOutOfStock || !Number.isFinite(line.count) || line.count <= 0 || line.count > 100 || !(item.add_unit > 0) || Math.abs(line.count / item.add_unit - Math.round(line.count / item.add_unit)) > 1e-8) return null;
        seen.add(line.product_id); total += Math.round(Number(item.price) * (1 - Number(item.discount_percent || 0) / 100) * line.count);
      }
      const code = String(request.discount_code || '').toUpperCase();
      if (code && !['WELCOME', 'PERSONAL10'].includes(code)) return null;
      if (code === 'PERSONAL10' && (!verified() || cycle.mobile !== request.customer_mobile)) return null;
      const discount = code === 'PERSONAL10' ? Math.min(Math.round(total * .1), 60000) : code === 'WELCOME' ? Math.min(10000, total) : 0;
      const tax = catalog.taxEnabled ? Math.round((total - discount) * Number(catalog.taxPercent || 0) / 100) : 0;
      return { total_amount: total, discount_amount: discount, shipping_cost: 0, tax_amount: tax, payment_amount: total - discount + tax, currency: 'IRT' };
    }
    if (operation === 'preview') {
      const bill = price(body);
      if (!bill) return failure('اقلام یا کد تخفیف معتبر نیست.');
      const quote_id = randomUUID();
      quotes.set(quote_id, { owner, cycle: key, fingerprint: requestFingerprint(body), bill, expires: now() + 5 * 60000 });
      return json({ ...bill, quote_id, mockOnly: true });
    }
    if (!['confirmCard', 'cancel', 'online'].includes(operation)) return failure('Not found', 404);
    if (typeof body.attempt_id !== 'string' || !/^[\w-]{8,100}$/.test(body.attempt_id)) return failure('شناسه تلاش معتبر نیست.');
    if (!phone(body.customer_mobile)) return failure('شماره همراه الزامی است.');
    const quote = quotes.get(body.quote_id), bill = price(body);
    if (!quote || quote.owner !== owner || quote.cycle !== key || quote.expires <= now() || quote.used || quote.fingerprint !== requestFingerprint(body) || !bill || JSON.stringify(bill) !== JSON.stringify(quote.bill)) return failure('مبلغ سفارش تغییر کرده است. دوباره بررسی کنید.', 409);
    if (operation === 'online' && (!gatewayFixture || !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(returnOrigin))) return json({ unavailable: true, mockOnly: true }, 503);
    const result = { attempt_id: body.attempt_id, state: operation === 'cancel' ? 'cancelled' : operation === 'online' ? 'pending_online' : 'confirmation_requested', mockOnly: true, payment_status: 'unverified', payment_amount: bill.payment_amount };
    if (operation !== 'cancel') {
      // BACKEND §19: real server resolves/creates the CUSTOMER from required
      // mobile, retaining created_by_device separately. No mandatory order OTP.
      // This hash is only an isolated synthetic attribution, not a real account.
      result.order_ref = 'LOCAL-' + randomUUID().slice(0, 8).toUpperCase(); result.customer_bound = true;
    }
    if (operation === 'online') result.payment_link = ROOT + 'gateway/' + body.attempt_id;
    quote.used = true;
    attempts.set(body.attempt_id, { owner, cycle: key, fingerprint, result, customerId: hash(body.customer_mobile), fulfilment: body.fulfilment });
    return json(result, 201);
  }
  return { handle };
}
module.exports = { createCheckoutMock, ROOT };
