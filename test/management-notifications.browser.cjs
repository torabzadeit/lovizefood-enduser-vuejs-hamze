// Run against dev:mock with PLAYWRIGHT_MODULE set if Playwright is outside this repo.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const createMock = require('../dev-mock/mock-core');
const sample = require('../dev-mock/sample-data.json');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const output = path.resolve(__dirname, '../.playwright-mcp/management-messages');

(async () => {
  const demo = createMock(sample);
  assert.equal(demo.handle('GET', '/api/enduser/profile/notifications', {}).body.unseenCount, 1);
  demo.handle('PUT', '/api/enduser/profile/notifications/seen', { ids: ['n-1'] });
  assert.equal(demo.handle('GET', '/api/enduser/profile/notifications', {}).body.unseenCount, 0);
  assert.equal(createMock(sample).handle('GET', '/api/enduser/profile/notifications', {}).body.unseenCount, 1);
  console.log('PASS local demo persists seen state within its factory only');

  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => console.error('Browser error:', error.message));
    let items = [{ id: 'test-message', title: 'پیام مدیریت', body: 'PRIVATE MESSAGE BODY', createDate: new Date().toISOString(), seenDate: null, ackDate: null }];
    let gets = 0;
    const seen = [];
    let failSeen = false;
    let ackCalls = 0;
    page.on('request', request => { if (/\/notifications\/[^/]+\/ack(?:\?|$)/.test(request.url())) ackCalls++; });
    const waitSeen = async count => {
      const deadline = Date.now() + 12000;
      while (seen.length < count && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      assert.equal(seen.length, count);
    };
    let fail = false;
    let holdGet = false;
    let releaseGet;
    await page.addInitScript(() => {
      window.__customerIntervals = new Map();
      const originalSet = window.setInterval.bind(window);
      const originalClear = window.clearInterval.bind(window);
      window.setInterval = (fn, ms, ...args) => {
        const id = originalSet(fn, ms, ...args);
        if (ms === 180000) window.__customerIntervals.set(id, () => fn(...args));
        return id;
      };
      window.clearInterval = id => { window.__customerIntervals.delete(id); originalClear(id); };
      window.__testVisibility = 'visible';
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__testVisibility });
    });
    await page.route('**/api/enduser/profile/notifications', async route => {
      gets++;
      if (holdGet) await new Promise(resolve => { releaseGet = resolve; });
      if (fail) return route.fulfill({ status: 503, json: { message: 'test refresh failure' } });
      await route.fulfill({ json: { items, unseenCount: items.filter(n => !n.seenDate).length } });
    });
    await page.route('**/api/enduser/profile/notifications/seen', async route => {
      const ids = route.request().postDataJSON().ids;
      seen.push(ids);
      if (failSeen) return route.fulfill({ status: 503, json: {} });
      items.forEach(n => { if (ids.includes(n.id)) n.seenDate = new Date().toISOString(); });
      await route.fulfill({ json: { ok: true } });
    });
    await page.route(/\/api\/enduser\/profile\/orders\/current(?:\?|$)/, route => route.fulfill({ json: null }));
    const banner = page.locator('.management-message-banner');
    const wait = fn => page.waitForFunction(fn);
    const navigate = url => page.goto(origin + url, { waitUntil: 'domcontentloaded' });
    const home = () => page.evaluate(() => {
      const root = document.querySelector('.laviz-storefront-shell');
      return !!(root && root.__vue__);
    });
    const dismissOffer = async () => {
      const close = page.locator('.osheet__close');
      for (let i = 0; i < 4 && await close.isVisible(); i++) {
        await close.click(); await page.waitForTimeout(250);
      }
      assert.equal(await close.isVisible(), false);
    };
    const tick = () => page.evaluate(() => window.__customerIntervals.forEach(fn => fn()));
    const visibility = state => page.evaluate(value => {
      window.__testVisibility = value;
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);

    await navigate('/');
    await page.waitForSelector('.laviz-topbar');
    assert.equal(await home(), true);
    await tick();
    assert.equal(gets, 0);
    assert.equal(await banner.count(), 0);
    assert.equal(await page.evaluate(() => window.__customerIntervals.size), 0);
    console.log('PASS guest sends no notification request and owns no poll timer');

    // Same reactive authentication transition emitted by the existing login component.
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test-customer', first_name: 'آزمایش' }));
      const vm = document.querySelector('.laviz-storefront-shell').__vue__;
      vm.auth.token = 'mock-token'; vm.auth.user = { id: 'test-customer' }; vm.auth.is_login = true;
    });
    await banner.waitFor({ state: 'visible' });
    assert.equal(await banner.innerText(), 'از رستوران لاویز پیام جدیدی دارید\nمشاهده');
    assert.equal(await banner.getAttribute('href'), '/profile?tab=messages');
    assert.equal(seen.length, 0);
    assert.equal(await page.evaluate(() => window.__customerIntervals.size), 1);
    assert.equal(await page.locator('body').innerText().then(t => t.includes('PRIVATE MESSAGE BODY')), false);
    console.log('PASS login shows private-text-free unread banner without marking read');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await banner.waitFor({ state: 'visible' });
    await dismissOffer();
    await page.evaluate(() => document.fonts.ready);
    const rects = await page.evaluate(() => {
      const b = document.querySelector('.management-message-banner').getBoundingClientRect();
      const h = document.querySelector('.main-fixed-header').getBoundingClientRect();
      return { bannerTop: b.top, headerBottom: h.bottom, right: b.right, width: document.documentElement.clientWidth };
    });
    assert.ok(rects.bannerTop >= rects.headerBottom - 1 && rects.right <= rects.width);
    await page.screenshot({ path: path.join(output, 'home-light-390x844.png') });
    await page.getByRole('button', { name: 'تغییر به حالت تاریک' }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(output, 'home-dark-390x844.png'), animations: 'disabled' });
    console.log('PASS restored session and mobile light/dark screenshots below fixed header');

    fail = true;
    let prior = gets;
    await Promise.all([page.waitForResponse(r => r.url().endsWith('/notifications') && r.status() === 503), tick()]);
    assert.equal(await banner.isVisible(), true);
    assert.ok(gets > prior);
    fail = false;
    await visibility('hidden'); prior = gets;
    await tick();
    assert.equal(gets, prior);
    await Promise.all([page.waitForResponse(r => r.url().endsWith('/notifications') && r.status() === 200), visibility('visible')]);
    console.log('PASS transient failure preserves banner; hidden polling pauses and resume refreshes');

    await dismissOffer();
    await banner.click();
    await page.waitForURL('**/profile?tab=messages');
    await page.locator('[role=tab][aria-selected=true]').filter({ hasText: 'پیام‌ها' }).waitFor();
    await page.waitForSelector('.notif__item');
    await waitSeen(1);
    await page.waitForFunction(() => !document.querySelector('.notif__dot'));
    assert.deepEqual(seen, [['test-message']]);
    assert.equal(await page.evaluate(() => window.__customerIntervals.size), 0);
    // The earlier 503 intentionally triggers the app's normal error toast.
    // Let it expire before recording successful navigation evidence.
    await page.getByText('خطایی در سرور رخ داد', { exact: false }).first().waitFor({ state: 'hidden' });
    await page.screenshot({ path: path.join(output, 'profile-messages-390x844.png') });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.laviz-topbar');
    await wait(() => document.querySelector('.laviz-storefront-shell').__vue__.$refs.managementMessages?.refreshing === false);
    assert.equal(await banner.count(), 0);
    console.log('PASS banner tap opens Messages; only shown IDs marked read; return clears banner and old timer');

    items.push({ ...items[0], id: 'new-arrival', seenDate: null });
    await tick();
    await banner.waitFor({ state: 'visible' });
    assert.equal(seen.length, 1);
    console.log('PASS new message reappears through existing timer without an active order');

    await navigate('/profile?tab=info');
    await page.waitForSelector('.profile-info');
    await wait(() => document.querySelector('.notif')?.__vue__?.loading === false);
    assert.equal(seen.length, 1);
    await page.getByRole('tab', { name: 'آدرس‌ها', exact: true }).click();
    await page.waitForURL('**tab=addresses');
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'اطلاعات', exact: true }).waitFor();
    assert.equal(await page.getByRole('tab', { name: 'اطلاعات', exact: true }).getAttribute('aria-selected'), 'true');
    assert.equal(seen.length, 1);
    await visibility('hidden');
    await page.getByRole('tab', { name: /پیام‌ها/ }).click();
    await page.waitForURL('**tab=messages');
    await page.waitForTimeout(150);
    assert.equal(seen.length, 1);
    await visibility('visible');
    await waitSeen(2);
    await page.waitForFunction(() => !document.querySelector('.notif__dot'));
    assert.deepEqual(seen[1], ['new-arrival']);
    console.log('PASS other tabs and hidden document do not mark seen; URL/back and visibility resume work');

    items.push({ ...items[0], id: 'retry-seen', seenDate: null });
    failSeen = true;
    await visibility('hidden');
    await visibility('visible');
    await waitSeen(3);
    await page.waitForSelector('.notif__dot');
    failSeen = false;
    await visibility('hidden');
    await visibility('visible');
    await waitSeen(4);
    await page.waitForFunction(() => !document.querySelector('.notif__dot'));
    assert.equal(ackCalls, 0);
    assert.equal(await page.locator('.notif__ack, .notif__acked').count(), 0);
    console.log('PASS failed seen stays unread and retries; no acknowledgement UI or call');

    await navigate('/profile?tab=invalid');
    await page.waitForSelector('[role=tab][aria-selected=true]');
    assert.equal(await page.locator('[role=tab][aria-selected=true]').innerText(), 'سفارش‌ها');
    console.log('PASS invalid tab falls back to Orders');

    await page.evaluate(() => window.$nuxt.$router.push('/'));
    await page.waitForSelector('.laviz-topbar');
    await wait(() => document.querySelector('.laviz-storefront-shell').__vue__.$refs.managementMessages?.refreshing === false);
    holdGet = true; await tick();
    await new Promise(resolve => {
      const timer = setInterval(() => { if (releaseGet) { clearInterval(timer); resolve(); } }, 10);
    });
    await page.evaluate(() => {
      localStorage.removeItem('token'); localStorage.removeItem('user');
      const vm = document.querySelector('.laviz-storefront-shell').__vue__;
      vm.auth.is_login = false; vm.auth.token = null;
    });
    items.push({ ...items[0], id: 'late-response', seenDate: null });
    holdGet = false;
    await Promise.all([page.waitForResponse(r => r.url().endsWith('/notifications')), Promise.resolve().then(() => releaseGet())]);
    prior = gets; await tick(); await visibility('visible');
    assert.equal(gets, prior);
    assert.equal(await banner.count(), 0);
    assert.equal(await page.evaluate(() => window.__customerIntervals.size), 0);
    console.log('PASS logout cleans timer; in-flight response cannot restore banner; no guest requests');
    await context.close();
    console.log('PASS all management notification browser checks');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
