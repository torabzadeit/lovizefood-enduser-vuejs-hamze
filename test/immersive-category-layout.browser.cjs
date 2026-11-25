const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const keys = ['shish-kebab', 'pizza-slice', 'plate-utensils', 'cup-straw', 'hat-chef', 'pizza', 'sandwich', 'burger', 'bowl-food', 'bottle-water', 'bread-slice', 'pepper-hot'];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [708, 390]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: width === 708 ? 1021 : 844 } });
      await context.addInitScript(value => { window.__lovizeDisableCategoryFixture = true; localStorage.setItem('pwaCallOut', '1'); localStorage.setItem('laviz_theme', value); }, theme);
      const page = await context.newPage(); const errors = [], consoleErrors = []; let creates = 0;
      page.on('pageerror', e => errors.push(e.message)); page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('request', r => { if (r.url().includes('/order/create')) creates++; });
      const supplied = theme === 'dark';
      if (supplied) await page.route('**/api/enduser/core/initialize', async route => {
        const response = await route.fetch(); const data = await response.json();
        data.categories = data.categories.map((category, index) => ({ ...category, iconKey: keys[index % keys.length] }));
        await route.fulfill({ response, json: data });
      });
      // Real cold main-header click, not direct story navigation or a route stub.
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'منوی تصویری', exact: true }).click();
      await page.locator('.story__details h1').waitFor({ timeout: 45000 });
      await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.currentTime > .1 && +getComputedStyle(v).opacity === 1; }, null, { timeout: 15000 });
      assert.equal(await page.locator('.nuxt-error').count(), 0);
      const host = () => page.evaluate(() => window.$nuxt.$router.currentRoute.matched.map(r => r.instances.default).find(vm => vm && vm.$options.computed && vm.$options.computed.basket).productKey);
      const geometry = await page.evaluate(() => {
        const box = q => { const r = document.querySelector(q).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
        return { logo: box('.story__logo'), back: box('.story__back'), grid: box('.story__explore-trigger'), first: box('.story__categories button'), rail: box('.story__category-sidebar'), card: box('.story__details'), add: box('.story__quantity'), price: box('.story__price'), previous: box('.story__direction--previous') };
      });
      assert.ok(geometry.back.x > geometry.logo.right); assert.ok(geometry.add.right < geometry.price.x);
      assert.equal(geometry.grid.x, geometry.first.x); assert.ok(Math.abs(geometry.grid.bottom - geometry.first.y) <= 1);
      assert.equal(geometry.first.width, geometry.first.height); assert.equal(geometry.first.width, 48);
      assert.ok(geometry.rail.bottom <= geometry.card.y - 10); assert.ok(geometry.previous.right <= geometry.rail.x);
      const icons = await page.locator('.story__categories button img').evaluateAll(items => items.map(img => img.src));
      if (supplied) { assert.equal(icons.length, await page.locator('.story__categories button').count()); assert.equal(new Set(icons).size, icons.length); }
      else { assert.equal(icons.length, 0); const markers = await page.locator('.story__category-index').allTextContents(); assert.equal(new Set(markers).size, markers.length); }
      if (process.env.CATEGORY_SHOTS) await page.screenshot({ path: '.local-dev/category-' + width + '-' + theme + '.png' });
      await page.locator('.story__add').click();
      const counts = await page.evaluate(() => JSON.stringify(window.$nuxt.$store.getters['basket/counts']));
      const surface = await page.locator('.story__swipe').boundingBox(); const y = surface.y + surface.height / 2;
      await page.mouse.move(surface.width * .2, y); await page.mouse.down(); await page.mouse.move(surface.width * .7, y, { steps: 5 });
      const incoming = await page.locator('.story__incoming-details').evaluate(el => ({ add: el.querySelector('.story__quantity').getBoundingClientRect().x, price: el.querySelector('.story__price').getBoundingClientRect().x }));
      assert.ok(incoming.add < incoming.price);
      if (process.env.CATEGORY_SHOTS && width === 390 && theme === 'light') await page.screenshot({ path: '.local-dev/category-incoming-390.png' });
      await page.mouse.up(); await page.waitForFunction(() => !document.querySelector('.story--settling'));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.story__categories button').last().click();
      const visible = await page.locator('.story__category--active').evaluate(el => { const r = el.getBoundingClientRect(), p = el.parentElement.getBoundingClientRect(); return r.top >= p.top - 1 && r.bottom <= p.bottom + 1; });
      assert.ok(visible, 'vertical rail reveals active category');
      const selectedKey = await host();
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      assert.equal(await page.locator('.story-explore__grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 3);
      await page.keyboard.press('Escape'); assert.equal(await host(), selectedKey);
      await page.getByRole('button', { name: 'بازگشت به منوی اصلی', exact: true }).click();
      await page.getByRole('button', { name: 'منوی تصویری', exact: true }).click();
      await page.locator('.story__details h1').waitFor();
      assert.equal(await page.evaluate(() => JSON.stringify(window.$nuxt.$store.getters['basket/counts'])), counts);
      assert.equal(await host(), selectedKey); assert.equal(await page.locator('.nuxt-error').count(), 0);
      assert.equal(creates, 0); assert.deepEqual(errors, []); assert.deepEqual(consoleErrors, []);
      console.log('PASS', width, theme, supplied ? 'unique supplied enum icons' : 'missing-icon ordinal fallback', 'cold first click, video, connected sidebar, swaps/incoming, rail scroll, grid and root roundtrip; zero console/page errors');
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
