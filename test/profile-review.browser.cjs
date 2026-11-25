// Every API mutation is intercepted; the running mock's reviews are never changed.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const createMock = require('../dev-mock/mock-core');
const sample = require('../dev-mock/sample-data.json');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const output = path.resolve(__dirname, '../.playwright-mcp/profile-review');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const theme of ['light', 'dark']) {
      const demo = createMock(sample);
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(value => {
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem('user', JSON.stringify({ id: 'profile-review-fixture', first_name: 'آزمایش' }));
        localStorage.setItem('pwaCallOut', '1');
        localStorage.setItem('laviz_theme', value);
      }, theme);
      let failPost = false, posts = 0, historyGets = 0;
      const payloads = [], errors = [];
      await context.route('**/api/**', async route => {
        const req = route.request(), url = new URL(req.url()), method = req.method();
        if (!['GET', 'OPTIONS'].includes(method)) {
          if (method === 'POST' && /^\/api\/enduser\/profile\/orders\/[^/]+\/review$/.test(url.pathname)) {
            posts++; payloads.push(req.postDataJSON());
            if (failPost) return route.fulfill({ status: 503, json: { message: 'خطای نمونهٔ آزمون' } });
          } else {
            // Existing automatic "seen" behavior stays inside this isolated fixture too.
            assert.equal(method, 'PUT', 'Unexpected fixture mutation');
            assert.match(url.pathname, /^\/api\/enduser\/profile\/(notifications\/seen|active-discount-codes\/[^/]+\/seen)$/);
          }
        }
        if (url.pathname === '/api/enduser/profile/orders') historyGets++;
        const result = demo.handle(method, url.pathname, ['POST', 'PUT'].includes(method) ? req.postDataJSON() : {}, url.searchParams);
        assert.ok(result, 'Unmapped API fixture: ' + method + ' ' + url.pathname);
        return route.fulfill({ status: result.status, json: result.body });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      page.on('pageerror', error => errors.push(error.message));
      const card = () => page.locator('.order-card').filter({ has: page.locator('.order-card__id', { hasText: '10431' }) });
      const group = () => card().locator('.star3d');
      const vector = () => card().locator('.star3d__btn clipPath rect').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('width'))));
      const modal = () => page.locator('#review-modal.show');
      await page.goto(origin + '/profile?tab=orders', { waitUntil: 'domcontentloaded' });
      await card().waitFor();
      assert.deepEqual(await vector(), [0, 0, 0, 0, 0]);
      assert.match(await group().getAttribute('aria-label'), /هنوز امتیازی/);
      await card().getByRole('button', { name: '5 ستاره', exact: true }).click();
      await modal().locator('.review-item').last().waitFor();
      await modal().locator('.review-item').nth(1).getByRole('radio', { name: '4 ستاره', exact: true }).click();
      const getsBefore = historyGets;
      await modal().getByRole('button', { name: 'ثبت نظر', exact: true }).click();
      await modal().waitFor({ state: 'hidden' });
      await page.waitForFunction(() => [...document.querySelectorAll('.order-card')].some(card =>
        card.querySelector('.order-card__id').textContent.trim() === '10431' && card.querySelector('.star3d').getAttribute('aria-label').includes('۴٫۵')));
      assert.ok(historyGets > getsBefore, 'Successful submit must reload history');
      assert.deepEqual(payloads[0].ratings.map(item => item.rating), [5, 4]);
      assert.deepEqual(await vector(), [24, 24, 24, 24, 12]);
      assert.match(await group().getAttribute('aria-label'), /۴٫۵ از ۵/);
      await card().scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `average-4.5-${theme}-390.png`), animations: 'disabled' });

      // Reload retains the same context-owned mock factory, as a real API would.
      await page.reload({ waitUntil: 'domcontentloaded' }); await card().waitFor();
      assert.deepEqual(await vector(), [24, 24, 24, 24, 12]);
      await group().evaluate(node => {
        window.__selectedReviewStars = [];
        node.__vue__.$on('select', n => window.__selectedReviewStars.push(n));
      });
      await card().getByRole('button', { name: '3 ستاره', exact: true }).click();
      await modal().locator('.review-item').last().waitFor();
      assert.deepEqual(await page.evaluate(() => window.__selectedReviewStars), [3]);
      assert.equal(await modal().locator('.review-item').nth(0).getByRole('radio', { name: '5 ستاره', exact: true }).getAttribute('aria-checked'), 'true');
      assert.equal(await modal().locator('.review-item').nth(1).getByRole('radio', { name: '4 ستاره', exact: true }).getAttribute('aria-checked'), 'true');
      await modal().locator('.review-item').nth(0).getByRole('radio', { name: '1 ستاره', exact: true }).click();
      failPost = true;
      await modal().getByRole('button', { name: 'ثبت نظر', exact: true }).click();
      await page.getByText('خطای نمونهٔ آزمون', { exact: true }).waitFor();
      assert.equal(await modal().isVisible(), true);
      assert.deepEqual(await vector(), [24, 24, 24, 24, 12]);
      await modal().getByRole('button', { name: 'انصراف', exact: true }).click();
      await modal().waitFor({ state: 'hidden' });
      await page.reload({ waitUntil: 'domcontentloaded' }); await card().waitFor();
      assert.deepEqual(await vector(), [24, 24, 24, 24, 12]);
      assert.equal(posts, 2);

      // Real Vue router navigation gives different prior routes; header always goes home.
      for (const previous of ['/immersive-menu', '/profile?tab=messages', '/']) {
        await page.evaluate(async previous => {
          await window.$nuxt.$router.push(previous);
          await window.$nuxt.$router.push('/profile?tab=orders');
        }, previous);
        await page.locator('.profile-header__back').waitFor();
        await page.locator('.profile-header__back').click();
        await page.waitForURL(url => url.pathname === '/' && !url.search);
        assert.equal(new URL(page.url()).pathname, '/');
      }
      assert.deepEqual(errors, [], 'Browser runtime errors');
      console.log(`PASS ${theme}: [5,4] average/fraction/accessible label, submitted GET, reload, integer select/modal, failed POST unchanged, header from three prior routes; intercepted POSTs=${posts}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
