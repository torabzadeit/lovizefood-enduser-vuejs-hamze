const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3347';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const output = path.resolve(__dirname, '../.playwright-mcp/restaurant-checkout');
fs.mkdirSync(output, { recursive: true });
async function device(page) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('.laviz-user-bar__login').waitFor({ timeout: 90000 });
  await page.waitForFunction(() => window.$nuxt?.$store.getters['basket/products'].some(p => !p.isOutOfStock && p.add_unit > 0));
  await page.evaluate(() => {
    const store = window.$nuxt.$store, product = store.getters['basket/products'].find(p => !p.isOutOfStock && p.add_unit > 0);
    store.commit('basket/increment', { key: product.key });
    window.__ordinaryCount = store.getters['basket/counts'][product.key]; window.__ordinaryKey = product.key;
  });
  await page.locator('.laviz-user-bar__login').click();
  await page.locator('input[name="mobile"]:visible').fill('09000000001');
  await page.locator('.auth-submit:visible').click();
  await page.locator('input[data-vv-scope="login"][name="verify_code"]:visible').fill('12345');
  await page.locator('.auth-submit:visible').click();
  await page.waitForURL('**/restaurant-mock');
  await page.locator('.story__details h1').waitFor();
  assert.equal(await page.locator('.story__top .story__back').count(), 0);
}
async function cart(page) {
  await page.waitForFunction(() => window.$nuxt?.$store.getters['restaurantMockBasket/products'].some(p => !p.isOutOfStock && p.add_unit > 0));
  await page.evaluate(() => {
    const store = window.$nuxt.$store, product = store.getters['restaurantMockBasket/products'].find(p => !p.isOutOfStock && p.add_unit > 0);
    store.commit('restaurantMockBasket/increment', { key: product.key });
  });
  await page.locator('.story__cart').click();
  await page.locator('[data-checkout="checkout"]').waitFor();
  await page.waitForFunction(() => !!document.querySelector('.restaurant-checkout')?.__vue__?.state.bill);
}
async function verify(page) {
  await page.locator('.rc-view-discounts').click();
  await page.locator('[data-checkout="otp"]').waitFor();
  await page.locator('#restaurant-otp').fill('000000');
  await page.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
  await page.locator('[data-checkout="otp"] .rc-error').waitFor();
  assert.equal(await page.locator('.offer-card').count(), 0);
  await page.locator('#restaurant-otp').fill('246810');
  await page.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
  await page.locator('.offer-card').waitFor();
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
        await context.addInitScript(value => { localStorage.setItem('pwaCallOut', '1'); localStorage.setItem('theme', value); }, theme);
        const page = await context.newPage(), errors = [], privateRequests = [], registrations = [];
        await page.clock.install();
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => { if (/Bearer mock-restaurant-/.test(req.headers().authorization || '') && /\/api\/enduser\/profile/.test(req.url())) privateRequests.push(req.url()); });
        page.on('request', req => { if (new URL(req.url()).pathname === '/api/auth/register') registrations.push(req.url()); });
        await device(page); const deviceToken = await page.evaluate(() => localStorage.getItem('token'));
        await cart(page); await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
        assert.equal(await page.locator('.rc-view-discounts').isDisabled(), true);
        assert.equal(await page.getByRole('button', { name: 'کارت میکشم', exact: true }).isDisabled(), true);
        await page.locator('#restaurant-phone').fill('abc09123456789'); await page.locator('#restaurant-phone').blur();
        await page.getByText('شماره همراه معتبر وارد کنید.', { exact: true }).waitFor();
        await page.locator('#restaurant-phone').fill('۰۹۱۲۳۴۵۶۷۸۹');
        await page.getByLabel('سرو در رستوران', { exact: true }).check();
        await page.getByLabel('بیرون بر', { exact: true }).check();
        await page.locator('input[name="restaurant-discount"]').fill('WELCOME');
        await page.locator('.rc-code button').click();
        await page.getByText('کد WELCOME اعمال شد.', { exact: true }).waitFor();
        await verify(page);
        await page.locator('.offer-card__apply').click();
        await page.getByText('کد PERSONAL10 اعمال شد.', { exact: true }).waitFor();
        const suffix = `${theme}-${viewport.width}x${viewport.height}`;
        await page.screenshot({ path: path.join(output, `checkout-${suffix}.png`), fullPage: true });
        await page.locator('.rc-total').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `checkout-totals-${suffix}.png`) });
        assert.equal(await page.evaluate(() => localStorage.getItem('token')), deviceToken);
        const count = await page.locator('.rc-stepper bdi').textContent();
        await page.locator('.rc-stepper button').last().click();
        await page.waitForFunction(() => !document.querySelector('.restaurant-checkout').__vue__.state.quoting);
        assert.notEqual(await page.locator('.rc-stepper bdi').textContent(), count);
        await page.getByRole('button', { name: 'کارت میکشم', exact: true }).click();
        await page.locator('[data-checkout="card"]').waitFor();
        assert.equal(await page.locator('.rc-confirm,.rc-cancel').count(), 0);
        await page.locator('.rc-edit').click(); await page.locator('[data-checkout="checkout"]').waitFor();
        assert.equal(await page.locator('#restaurant-phone').inputValue(), '۰۹۱۲۳۴۵۶۷۸۹');
        assert.equal(await page.getByLabel('بیرون بر', { exact: true }).isChecked(), true);
        assert.equal(await page.locator('.offer-card').count(), 1);
        await page.getByText('کد PERSONAL10 اعمال شد.', { exact: true }).waitFor();
        await page.locator('#restaurant-phone').fill('09123456780');
        assert.equal(await page.locator('.offer-card').count(), 0);
        assert.equal(await page.locator('.rc-applied').count(), 0);
        assert.equal(await page.locator('[data-checkout="otp"]').count(), 0);
        assert.equal(await page.locator('[data-checkout] input[name="first_name"], [data-checkout] input[name="last_name"]').count(), 0);
        await page.waitForFunction(() => !!document.querySelector('.restaurant-checkout').__vue__.state.bill);
        await page.getByRole('button', { name: 'کارت میکشم', exact: true }).click();
        await page.locator('[data-checkout="card"]').waitFor();
        await page.screenshot({ path: path.join(output, `card-immediate-${suffix}.png`) });
        await page.clock.fastForward(30000);
        await page.locator('.rc-confirm').waitFor();
        assert.equal(await page.locator('.rc-cancel').count(), 1);
        assert.equal(await page.locator('.rc-cancel').textContent(), 'سفارش کنسل شد');
        await page.screenshot({ path: path.join(output, `card-ready-${suffix}.png`) });
        if (theme === 'dark') await page.locator('.rc-cancel').click(); else await page.locator('.rc-confirm').click();
        await page.locator('[data-checkout="result"]').waitFor();
        assert.equal(await page.locator('.modal-content:visible').getByText(/آزمایشی|پیش‌نمایش|mock|بدون پرداخت واقعی/i).count(), 0);
        assert.equal(await page.evaluate(() => window.$nuxt.$store.getters['restaurantMockBasket/selectedProducts'].length), 0);
        assert.equal(await page.evaluate(() => window.$nuxt.$store.getters['basket/counts'][window.__ordinaryKey] === window.__ordinaryCount), true);
        const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, basket: window.$nuxt.$store.state.basket }));
        assert.equal(/0912345678|۰۹۱۲۳۴۵۶۷۸۹|PERSONAL10|246810/.test(storage), false);
        assert.equal(registrations.length, 0); assert.equal(privateRequests.length, 0); assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        console.log('PASS exact flow, OTP, edit, phone isolation, POS ' + (theme === 'dark' ? 'cancel ' : 'request ') + suffix);
        await context.close();
      }
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => localStorage.setItem('pwaCallOut', '1'));
    const page = await context.newPage(); await device(page); await cart(page);
    await page.locator('#restaurant-phone').fill('09123456789');
    await page.waitForFunction(() => !!document.querySelector('.restaurant-checkout').__vue__.state.bill);
    await page.route('**/checkout/online', route => route.fulfill({ status: 503, json: { unavailable: true } }));
    await page.getByRole('button', { name: 'پرداخت آنلاین', exact: true }).click();
    await page.getByText('اتصال این خدمت هنوز آماده نیست. لطفاً با مسئول رستوران تماس بگیرید.', { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/restaurant-mock');
    await page.unroute('**/checkout/online');
    await page.getByRole('button', { name: 'پرداخت آنلاین', exact: true }).click();
    await page.waitForURL('**/api/enduser/mock/restaurant/checkout/gateway/**');
    await page.getByRole('heading', { name: 'Local gateway fixture' }).waitFor();
    await page.getByRole('link', { name: 'Return to restaurant' }).click();
    await page.goto(origin + '/restaurant-mock?status=paid');
    await page.locator('.story__details h1').waitFor();
    assert.equal(await page.locator('[data-checkout="result"]').count(), 0);
    await page.reload(); await page.locator('.story__details h1').waitFor();
    await page.goto(origin + '/profile'); await page.waitForURL('**/restaurant-mock');
    await page.locator('.story__details h1').waitFor();
    console.log('PASS unavailable online, isolated gateway URL, no query-paid authority');
    await context.close();
    for (const forged of [false, true]) {
      const restricted = await browser.newContext();
      if (forged) await restricted.addInitScript(() => { localStorage.setItem('token', 'mock-token'); localStorage.setItem('user', JSON.stringify({ mobile: '09000000001', mockOnly: true, scopes: ['restaurant:mock'] })); });
      const denied = await restricted.newPage(); await denied.goto(origin + '/restaurant-mock'); await denied.waitForURL(origin + '/');
      assert.equal(await denied.locator('[data-checkout="checkout"]').count(), 0); await restricted.close();
    }
    console.log('PASS device reload/profile guard, guest and forged flag denied');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
