// Targeted checks only. Use REFUND_TEST_MODE=actual for the running local mock.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const createMock = require('../dev-mock/mock-core');
const sample = require('../dev-mock/sample-data.json');
const card = '6219861034529007'; // Public README fixture, no customer data.
const displayed = '۶۲۱۹ ۸۶۱۰ ۳۴۵۲ ۹۰۰۷';
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const output = path.resolve(__dirname, '../.playwright-mcp/refund-card');
const actual = process.env.REFUND_TEST_MODE === 'actual';

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      if (sessionStorage.getItem('refund-test-guest') === 'true') return;
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'mock-user', first_name: 'کاربر', last_name: 'نمونه' }));
      localStorage.setItem('laviz_review_dismissed', 'true');
      localStorage.setItem('pwaCallOut', '1');
    });
    const demo = createMock(sample);
    let failGet = false, failPut = false, ignorePut = false, failReadback = false, held = false, release;
    let puts = 0, gets = 0, status = 11;
    const mutations = [];
    page.on('request', request => {
      if (/\/api\//.test(request.url()) && !['GET', 'OPTIONS'].includes(request.method())) {
        mutations.push({ method: request.method(), path: new URL(request.url()).pathname });
      }
    });
    if (!actual) {
      await page.route(/\/api\/enduser\/profile$/, async route => {
        const request = route.request();
        const method = request.method();
        if (method === 'GET') {
          gets++;
          if (held) await new Promise(resolve => { release = resolve; });
          if (failGet || (failReadback && puts > 0)) return route.fulfill({ status: 503, json: { message: 'fixture failure' } });
        } else if (method === 'PUT') {
          puts++;
          if (failPut) return route.fulfill({ status: 503, json: { result: [{ error: { value: card } }] } });
          if (ignorePut) return route.fulfill({ json: { ok: true } });
          const body = request.postDataJSON();
          assert.equal(body.name, 'کاربر', 'Name must be preserved');
          assert.equal(body.family, 'نمونه', 'Family must be preserved');
          assert.deepEqual(Object.keys(body).sort(), ['bankCardNumber', 'family', 'name']);
        }
        const result = demo.handle(method, '/api/enduser/profile', method === 'PUT' ? request.postDataJSON() : {});
        return route.fulfill({ status: result.status, json: result.body });
      });
      await page.route(/\/api\/enduser\/profile\/orders\/current(?:\?|$)/, route => {
        const result = demo.handle('GET', '/api/enduser/profile/orders/current').body;
        result.order.status = status;
        result.order.rejectReason = 'دلیل نمونهٔ محلی';
        return route.fulfill({ json: result });
      });
    }
    const dismiss = async () => {
      const close = page.locator('.osheet__close');
      if (await close.isVisible()) await close.click();
      await page.waitForTimeout(600);
      if (await close.isVisible()) await close.click();
    };
    const goto = async route => {
      await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.laviz-topbar, .profile-page');
      await dismiss();
    };
    const chooseRejected = async () => {
      await page.getByRole('button', { name: 'حالت‌های سفارش', exact: true }).click();
      await page.getByRole('button', { name: '۱۱ · سفارش تأیید نشد', exact: true }).click();
      await page.getByRole('button', { name: 'نمایش روی کارت', exact: true }).click();
      await page.locator('.lcp-page-preview .aoc__refund').waitFor({ state: 'visible' });
    };
    const noPanInStorage = async () => {
      assert.equal(await page.evaluate(value => [JSON.stringify(localStorage), JSON.stringify(sessionStorage), location.href].some(text => text.includes(value)), card), false);
    };
    const input = page.locator('#refund-bank-card');
    const form = page.locator('.bank-card-form');
    const save = () => page.getByRole('button', { name: 'ذخیره شماره کارت', exact: true }).click();
    const waitError = text => form.getByRole('alert').filter({ hasText: text }).waitFor();
    const shot = async name => page.screenshot({ path: path.join(output, name), fullPage: false });
    const layoutCheck = async () => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
    };

    await goto('/');
    if (actual) {
      // No interception/shim: only the running same-port mock may satisfy this.
      const api = new URL(await page.evaluate(() => window.$nuxt.$axios.defaults.baseURL));
      assert.ok(['localhost', '127.0.0.1'].includes(api.hostname) && api.port === '3003', 'Fixture may only be sent to the local mock');
      const ready = await page.evaluate(async () => {
        const response = await window.$nuxt.$axios.get('/api/enduser/profile');
        return Object.prototype.hasOwnProperty.call(response.data, 'bankCardNumber');
      });
      assert.equal(ready, true, 'Running mock has not reloaded the bankCardNumber contract');
      await chooseRejected();
    }
    const refund = actual ? page.locator('.lcp-page-preview .aoc__refund') : page.locator('.aoc__refund');
    await refund.waitFor({ state: 'visible' });
    assert.equal(await refund.locator('.aoc__refund-policy').innerText(), 'مبلغ پرداخت شده تا پایان روز جاری به شماره کارت ثبت شده برگشت خواهد شد.');
    if (await refund.locator('bdi').count()) {
      assert.equal(actual, true, 'Controlled test begins without a card');
      await goto('/profile?tab=bank-card');
    } else {
      await shot((actual ? 'actual-' : '') + 'rejected-no-card-light-390.png');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await layoutCheck(); await shot((actual ? 'actual-' : '') + 'rejected-no-card-dark-390.png');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await refund.getByRole('link', { name: 'ثبت شماره کارت', exact: true }).click();
    }
    await page.waitForURL('**/profile?tab=bank-card');
    await input.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'refund-bank-card');
    assert.equal(await page.getByRole('tab', { name: 'شماره کارت', exact: true }).getAttribute('aria-selected'), 'true');
    const writesBefore = mutations.filter(r => r.path === '/api/enduser/profile').length;
    await input.fill('6219');
    await save();
    await waitError('دقیقاً ۱۶ رقم');
    assert.equal(mutations.filter(r => r.path === '/api/enduser/profile').length, writesBefore);
    console.log('PASS rejected copy, CTA deep link, focus, invalid input never PUT');

    if (!actual) {
      ignorePut = true;
      await input.fill('۶۲۱۹-۸۶۱۰ ۳۴۵۲ ۹۰۰۷'); await save();
      await waitError('در سرور تأیید نشد');
      assert.equal(await form.locator('.bank-card-form__saved').count(), 0);
      assert.equal(await form.getByText('شماره کارت ذخیره شد.', { exact: true }).count(), 0);
      ignorePut = false; failPut = true;
      await save(); await waitError('ممکن نشد');
      assert.equal((await page.locator('body').innerText()).includes(card), false, 'Server echo leaked into UI');
      failPut = false;
      console.log('PASS ignored-field 200 and PUT failure never confirm; server echo suppressed');
    }
    await input.fill('۶۲۱۹-۸۶۱۰ ۳۴۵۲ ۹۰۰۷'); await save();
    await form.getByText('شماره کارت ذخیره شد.', { exact: true }).waitFor();
    assert.equal(await form.locator('bdi').innerText(), displayed);
    assert.equal(await input.inputValue(), '');
    await noPanInStorage(); await layoutCheck();
    await shot((actual ? 'actual-' : '') + 'profile-confirmed-light-390.png');
    for (const width of [390, 515]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
        await layoutCheck(); await shot((actual ? 'actual-' : '') + `profile-confirmed-${theme}-${width}.png`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    assert.equal(await page.getByRole('link', { name: 'بازگشت به سفارش', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'بازگشت', exact: true }).click();
    await page.locator('.laviz-topbar').waitFor(); await dismiss();
    if (actual) await chooseRejected();
    await refund.locator('bdi').waitFor();
    assert.equal(await refund.locator('bdi').innerText(), displayed);
    assert.equal(await refund.locator('bdi').evaluate(el => getComputedStyle(el).direction), 'ltr');
    console.log('PASS save + confirmed GET, return home shows grouped Persian/LTR card');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.laviz-topbar').waitFor(); await dismiss();
    if (actual) await chooseRejected();
    await refund.locator('bdi').waitFor(); await noPanInStorage();
    for (const width of [390, 515]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
        await refund.scrollIntoViewIfNeeded(); await layoutCheck();
        await shot((actual ? 'actual-' : '') + `rejected-saved-${theme}-${width}.png`);
      }
    }
    assert.equal(mutations.some(r => /refund|transfer|\/order\//.test(r.path)), false, 'Unexpected order/refund side effect');
    console.log('PASS reload uses API memory, no PAN in browser storage/URL, 390/515 both themes, no refund/order mutation');

    if (!actual) {
      for (const next of [1, 2, 10, 12, 13]) {
        status = next; await goto('/');
        await page.locator('.aoc:visible').first().waitFor();
        assert.equal(await page.locator('.aoc__refund').count(), 0);
      }
      status = 11; failGet = true;
      await goto('/'); await page.locator('.aoc__refund-link').waitFor();
      assert.equal(await page.locator('.aoc__refund bdi').count(), 0);
      await page.locator('.aoc__refund-link').click(); await waitError('دریافت اطلاعات');
      failGet = false;
      await page.getByRole('button', { name: 'تلاش دوباره', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('#refund-bank-card').disabled);
      failReadback = true; puts = 0;
      await input.fill(card); await save(); await waitError('تأیید ذخیره');
      assert.equal(await form.getByText('شماره کارت ذخیره شد.', { exact: true }).count(), 0);
      failReadback = false;
      console.log('PASS other statuses have no refund UI; GET retry and failed readback are honest');

      held = true; release = null;
      await goto('/');
      while (!release) await page.waitForTimeout(30);
      await page.evaluate(() => {
        const home = document.querySelector('.laviz-storefront-shell').__vue__;
        localStorage.removeItem('token'); localStorage.removeItem('user');
        home.auth.is_login = false; home.auth.token = null; home.auth.user = null;
      });
      held = false; release(); await page.waitForTimeout(300);
      assert.equal(await page.locator('.aoc__refund bdi').count(), 0);
      await page.goto(origin + '/profile?tab=bank-card', { waitUntil: 'domcontentloaded' });
      // Disable the init script's demo credential for this final guest check.
      await page.evaluate(() => { localStorage.clear(); sessionStorage.setItem('refund-test-guest', 'true'); });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(origin + '/');
      assert.equal(await page.locator('#refund-bank-card').count(), 0);
      await noPanInStorage();
      console.log('PASS logout discards late card response; guest cannot mount card form');
    }
    assert.deepEqual(errors, [], 'Unexpected browser runtime errors');
    await context.close();
    console.log(actual ? 'ACTUAL LOCAL MOCK + DRAWER 11 PASSED' : 'CONTROLLED REFUND BROWSER CHECKS PASSED');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
