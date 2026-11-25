const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const loggedIn of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(auth => {
        localStorage.setItem('pwaCallOut', '1');
        if (auth) { localStorage.setItem('token', 'mock-token'); localStorage.setItem('user', JSON.stringify({ id: 'mock-user', first_name: 'نمونه' })); }
      }, loggedIn);
      const page = await context.newPage(); const errors = []; let creates = 0;
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', req => { if (/\/api\/enduser\/order\/create/.test(req.url())) creates++; });
      await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' });
      await page.locator('.story__details h1').waitFor({ timeout: 60000 });
      assert.equal(await page.locator('.story__details').count(), 1);
      assert.equal(await page.locator('.story__cart').isDisabled(), true);
      assert.equal(await page.locator('.story__photo img').count(), 0, 'mock SVG must not be shown as a photo');
      if (!loggedIn) {
        await page.route('https://image.example.test/photo.jpg', route => route.request().resourceType() === 'fetch'
          ? route.abort('failed') : route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
        await page.evaluate(() => document.querySelector('.story').__vue__.loadPhoto('https://image.example.test/photo.jpg'));
        await page.locator('.story__photo img').waitFor();
        assert.equal(await page.locator('.story__photo img').getAttribute('src'), 'https://image.example.test/photo.jpg');
        await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
        assert.equal(await page.locator('.story__details').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(28, 28, 28, 0.78)');
        await page.evaluate(() => document.querySelector('.story').__vue__.clearPhoto());
      }
      const firstCategory = await page.locator('.story__category').count(); assert.ok(firstCategory > 0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await page.evaluate(async () => { const vm = document.querySelector('.story').__vue__; for (let i = 0; i < 50; i++) vm.move(1); await vm.$nextTick(); });
      await page.waitForFunction(() => { const rail = document.querySelector('.story__categories'); const active = rail.querySelector('[aria-pressed="true"]'); const a = active.getBoundingClientRect(); const r = rail.getBoundingClientRect(); return a.left >= r.left - 1 && a.right <= r.right + 1; });
      assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, 'category reveal must not scroll page');
      if (firstCategory > 1) {
        await page.locator('.story__category').nth(1).click();
        const state = await page.evaluate(() => { const vm = document.querySelector('.story').__vue__; return { key: vm.productKey, first: vm.$store.getters['basket/categoryProducts'](vm.categoryId)[0].key }; });
        assert.equal(state.key, state.first);
      }
      const available = await page.evaluate(() => { const vm = document.querySelector('.story').__vue__; const item = vm.products.find(p => !p.isOutOfStock && p.add_unit > 0); vm.setProduct(item); return item && item.key; });
      assert.ok(available);
      await page.locator('.story__add').click();
      const added = await page.evaluate(key => window.$nuxt.$store.getters['basket/counts'][key], available);
      assert.ok(added > 0); assert.equal(await page.locator('.story__cart').isEnabled(), true);
      await page.locator('.story__quantity button[aria-label="کم کردن"]').click();
      assert.equal(await page.locator('.story__cart').isDisabled(), true);
      await page.locator('.story__add').click();
      await page.locator('.story__cart').click();
      await page.waitForFunction(() => { const vm = document.querySelector('.laviz-storefront-shell')?.__vue__; return vm && !vm.loading && (vm.cartOpen || vm.pendingContinue); }, null, { timeout: 60000 });
      const result = await page.evaluate(async key => { const vm = document.querySelector('.laviz-storefront-shell').__vue__; return { count: vm.productData[key].count, cart: vm.cartOpen, pending: vm.pendingContinue, again: await vm.$store.dispatch('basket/consumeCheckoutIntent') }; }, available);
      assert.equal(result.count, added); assert.equal(result.cart, loggedIn); assert.equal(!!result.pending, !loggedIn); assert.equal(result.again, false);
      await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' });
      await page.locator('.story__details h1').waitFor({ timeout: 60000 });
      assert.equal(creates, 0); assert.deepEqual(errors, []);
      console.log('PASS story direct route, categories, counts and checkout intent:', loggedIn ? 'customer' : 'guest');
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
