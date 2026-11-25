// Local synthetic credentials only. No SMS, orders, payment or personal data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const api = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:3003';
const output = path.resolve(__dirname, '../.playwright-mcp/menu-initialize');

async function run(browser) {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(api).hostname));
  fs.mkdirSync(output, { recursive: true });
  const setup = await browser.newContext();
  const deviceLogin = async () => {
    const check = await setup.request.post(api + '/api/auth/check-mobile', { data: { mobile: '09000000001' } });
    assert.equal(check.status(), 200);
    const login = await setup.request.post(api + '/api/auth/login', { data: { mobile: '09000000001', verify_code: '12345' } });
    assert.equal(login.status(), 200);
    return (await login.json()).token;
  };
  const live = await deviceLogin(), revoked = await deviceLogin();
  assert.equal((await setup.request.delete(api + '/api/enduser/mock/restaurant/session', {
    headers: { Authorization: `Bearer ${revoked}` },
  })).status(), 200);
  const results = [];
  const cases = [
    { name: 'public' },
    { name: 'ordinary', token: 'synthetic-customer-token' },
    { name: 'stale-ordinary-401', token: 'synthetic-stale-customer', rejectOrdinary: true, cleared: true },
    { name: 'missing-token', userOnly: true },
    { name: 'revoked-device', token: revoked, cleared: true },
    { name: 'revoked-device-direct', token: revoked, route: '/restaurant-mock', cleared: true },
    { name: 'revoked-device-story', token: revoked, route: '/immersive-menu', cleared: true, story: true },
    { name: 'valid-device', token: live, kiosk: true },
    { name: 'valid-device-missing-user', token: live, kiosk: true, noUser: true },
    { name: 'public-outage-retry', outage: true },
    { name: 'ordinary-outage-retry', token: 'synthetic-customer-token', outage: true },
    { name: 'device-outage-retry', token: live, kiosk: true, outage: true },
    { name: 'revoked-device-outage-retry', token: revoked, cleared: true, outage: true },
  ];
  try {
    for (const fixture of cases) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        let outage = fixture.outage, rejected = false;
        const network = [], errors = [], privateDeviceRequests = [];
        await context.addInitScript(({ token, userOnly, noUser }) => {
          // Seed once so 401 reload exercises the real cleanup, not reseeding.
          if (sessionStorage.getItem('menu-initialize-seeded')) return;
          sessionStorage.setItem('menu-initialize-seeded', '1');
          if (token) localStorage.setItem('token', token);
          if ((token || userOnly) && !noUser) localStorage.setItem('user', JSON.stringify({ id: 'synthetic-menu-test', first_name: 'آزمایش' }));
          localStorage.setItem('pwaCallOut', '1');
          localStorage.setItem('laviz_theme', 'light');
          localStorage.setItem('unrelated-menu-test', 'keep');
        }, { token: fixture.token, userOnly: fixture.userOnly, noUser: fixture.noUser });
        await context.route('**/api/**', async route => {
          const request = route.request(), url = new URL(request.url()), method = request.method();
          const device = /^Bearer mock-restaurant-/.test(request.headers().authorization || '');
          if (device && /\/profile\//.test(url.pathname)) privateDeviceRequests.push(url.pathname);
          // Ordinary pages mark fixture notifications/codes seen automatically.
          // Isolate these writes; auth was performed explicitly above with mock data.
          if (!['GET', 'OPTIONS'].includes(method)) return route.fulfill({ status: 200, json: { ok: true } });
          if (outage) return route.abort('connectionrefused');
          if (fixture.rejectOrdinary && !rejected && url.pathname.endsWith('/core/initialize')) {
            rejected = true;
            return route.fulfill({ status: 401, json: { statusCode: 401 } });
          }
          await route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
          if (new URL(response.url()).pathname.startsWith('/api/')) network.push({ path: new URL(response.url()).pathname, status: response.status() });
        });
        await page.goto(origin + (fixture.route || '/'), { waitUntil: 'domcontentloaded' });
        if (outage) {
          await page.getByRole('button', { name: 'تلاش دوباره', exact: true }).waitFor();
          assert.ok(await page.evaluate(() => localStorage.getItem('token')) === (fixture.token || null), fixture.name + ': outage must retain credentials');
          const customerState = await page.evaluate(() => {
            const queue = [window.$nuxt];
            while (queue.length) { const item = queue.shift(); if (item && item.$options && item.$options.__file && /pages[\\/]index.vue$/.test(item.$options.__file)) return !!item.auth.is_login; if (item) queue.push(...item.$children); }
            return false;
          });
          if ((fixture.token || '').startsWith('mock-restaurant-')) assert.equal(customerState, false);
          await page.screenshot({ path: path.join(output, fixture.name + '-error.png') });
          outage = false;
          await page.getByRole('button', { name: 'تلاش دوباره', exact: true }).click();
        }
        if (fixture.kiosk) {
          await page.waitForURL('**/restaurant-mock', { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => window.$nuxt && window.$nuxt.$store.getters['restaurantMockBasket/products'].length > 0);
        } else if (fixture.story) {
          await page.waitForFunction(() => window.$nuxt && window.$nuxt.$store.getters['basket/products'].length > 0);
        } else {
          await page.locator('.product-card').first().waitFor();
          await page.locator('.product-card').first().scrollIntoViewIfNeeded();
          await page.waitForFunction(() => [...document.querySelectorAll('.product-card')].some(card => {
            if (card.getBoundingClientRect().top >= innerHeight) return false;
            for (let node = card; node && node !== document.body; node = node.parentElement) {
              if (Number(getComputedStyle(node).opacity) < 0.95) return false;
            }
            return true;
          }));
        }
        if (fixture.outage) await page.waitForFunction(() => !document.getElementById('menu-initialize-error'));
        const state = await page.evaluate(() => ({ token: localStorage.getItem('token'), user: localStorage.getItem('user'),
          kept: localStorage.getItem('unrelated-menu-test'), forbidden: document.body.innerText.includes('شما به این بخش دسترسی ندارید'),
          unavailable: document.body.innerText.includes('منو در دسترس نیست'),
        }));
        assert.equal(state.kept, 'keep');
        assert.equal(state.unavailable, false, fixture.name);
        assert.equal(state.forbidden, false, fixture.name);
        assert.ok(state.token === (fixture.cleared ? null : fixture.token || null), fixture.name + ': credential state');
        if (fixture.cleared) assert.equal(state.user, null);
        assert.deepEqual(privateDeviceRequests, [], fixture.name);
        assert.deepEqual(errors, [], fixture.name);
        if (!fixture.outage && !fixture.rejectOrdinary) assert.ok(!network.some(item => item.status === 403), fixture.name);
        await page.screenshot({ path: path.join(output, fixture.name + '-success.png') });
        // Output contains paths/statuses and booleans only, never credentials.
        results.push({ name: fixture.name, passed: true, privateDeviceRequests: privateDeviceRequests.length, network });
      } catch (error) { throw new Error(fixture.name + ': ' + error.message); }
      finally { await context.close(); }
    }
    // Server denial remains in force even though public UI recovered.
    for (const token of [live, revoked]) {
      for (const endpoint of ['/api/enduser/profile/addresses', '/api/enduser/profile/active-discount-codes']) {
        assert.equal((await setup.request.get(api + endpoint, { headers: { Authorization: `Bearer ${token}` } })).status(), 403);
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ date: '2026-11-25', results, guardsRejected: 4 }, null, 2));
    return { passed: results.length, guardsRejected: 4, screenshots: output };
  } finally {
    await setup.request.delete(api + '/api/enduser/mock/restaurant/session', { headers: { Authorization: `Bearer ${live}` } });
    await setup.close();
  }
}
module.exports = { run };
if (require.main === module) {
  (async () => {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try { console.log(JSON.stringify(await run(browser))); } finally { await browser.close(); }
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
