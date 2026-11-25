const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of [{ width: 587, height: 781 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(value => { localStorage.setItem('pwaCallOut', '1'); localStorage.setItem('laviz_theme', value); }, theme);
      const page = await context.newPage(); const errors = []; let creates = 0;
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (r.url().includes('/order/create')) creates++; });
      await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' });
      await page.locator('.story__details h1').waitFor({ timeout: 45000 });
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      assert.equal(await page.locator('.story__cart-total small').innerText(), 'جمع مبلغ');
      assert.equal(await page.locator('.story__add').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(138, 19, 24)');
      assert.match(await page.locator('.story__logo').evaluate(el => getComputedStyle(el).filter), /drop-shadow/);
      await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 2 && !v.paused; }).catch(async error => {
        console.log('PLAYER DIAGNOSTIC', await page.evaluate(() => { const v = document.querySelector('video'); const vm = v && v.__vue__; return { html: v && v.outerHTML, state: vm && { active: vm.active, failed: vm.failed, reduced: vm.reduced, visible: vm.visible, inView: vm.inView }, media: v && { ready: v.readyState, error: v.error, paused: v.paused, current: v.currentTime }, host: document.querySelector('.story').__vue__.productKey }; })); throw error;
      });
      if (viewport.width === 587 && theme === 'light' && !process.env.SKIP_LOOP) {
        await page.waitForFunction(() => {
          const v = document.querySelector('video'); const p = window.__loopProbe || (window.__loopProbe = { max: 0 });
          p.max = Math.max(p.max, v.currentTime);
          return p.max > v.duration - .35 && v.currentTime < .75;
        }, null, { timeout: 18000, polling: 40 });
        console.log('PASS natural video loop', await page.evaluate(() => ({ max: window.__loopProbe.max, now: document.querySelector('video').currentTime, duration: document.querySelector('video').duration })));
      }
      if (process.env.EXPLORE_SHOTS && viewport.width === 587 && theme === 'light') await page.screenshot({ path: '.local-dev/story-explore-587.png' });
      const first = await page.evaluate(() => document.querySelector('.story').__vue__.productKey);
      const surface = await page.locator('.story__swipe').boundingBox(); const y = surface.y + surface.height / 2;
      await page.mouse.move(viewport.width * .3, y); await page.mouse.down(); await page.mouse.move(viewport.width * .7, y, { steps: 8 }); await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.story').__vue__.motionPhase === 'idle');
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.index), 1);
      await page.mouse.move(viewport.width * .7, y); await page.mouse.down(); await page.mouse.move(viewport.width * .3, y, { steps: 8 }); await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.story').__vue__.motionPhase === 'idle');
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.productKey), first);
      // Short and cancelled drags never navigate; normal button activation remains single-step.
      await page.mouse.move(viewport.width / 2, y); await page.mouse.down(); await page.mouse.move(viewport.width / 2 - 20, y); await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.story').__vue__.motionPhase === 'idle');
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.index), 0);
      await page.mouse.move(viewport.width / 2, y); await page.mouse.down();
      await page.evaluate(() => document.querySelector('.story__swipe').dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })));
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.story').__vue__.motionPhase === 'idle');
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.index), 0, 'cancel preserves current product');
      await page.locator('.story__add').click();
      const saved = await page.evaluate(() => { const vm = document.querySelector('.story').__vue__; return { key: vm.productKey, counts: JSON.stringify(vm.$store.getters['basket/counts']) }; });
      const halo = await page.locator('.story__category--active').evaluate(el => { const a = el.getBoundingClientRect(); const r = el.parentElement.getBoundingClientRect(); return { top: a.top-r.top, bottom: r.bottom-a.bottom, left: a.left-r.left, right: r.right-a.right }; });
      assert.ok(halo.top >= 0 && halo.bottom >= 0 && halo.left >= 20 && halo.right >= 20);
      assert.equal(await page.locator('.story__category-sidebar button').first().getAttribute('aria-label'), 'نمایش همهٔ غذاها');
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      assert.equal(await page.locator('video').evaluate(v => v.paused), true);
      const columns = await page.locator('.story-explore__grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(columns, 3);
      if (viewport.width === 587 && theme === 'light') {
        await page.route('**/explore-broken.jpg', r => r.fulfill({ contentType: 'image/jpeg', body: 'not an image', headers: { 'access-control-allow-origin': '*' } }));
        const imageRequest = page.waitForRequest(r => r.url().endsWith('/explore-broken.jpg') && r.resourceType() === 'image');
        const original = await page.evaluate(() => {
          const vm = document.querySelector('.story').__vue__; const state = vm.$store.state.basket;
          const data = { products: state.basket.products.map(p => ({ ...p })), categories: state.categories, ...state.pricing };
          vm.$store.commit('basket/loaded', { ...data, products: data.products.map(p => p.key === vm.products[0].key ? { ...p, thumbnail: 'http://localhost:3333/explore-broken.jpg' } : p) });
          return data;
        });
        await imageRequest;
        await page.waitForFunction(() => !document.querySelector('.story-explore__tile img'));
        assert.equal(await page.locator('.story-explore__tile').first().locator('img').count(), 0, 'broken raster stays blank');
        await page.evaluate(value => { window.$nuxt.$store.commit('basket/loaded', value); }, original);
        assert.equal(await page.locator('.story-explore__tile').first().locator('img').count(), 0, 'mock SVG stays blank');
      }
      if (process.env.EXPLORE_SHOTS) await page.screenshot({ path: '.local-dev/explore-' + viewport.width + '-' + theme + '.png' });
      const keyBefore = await page.evaluate(() => document.querySelector('.story').__vue__.productKey);
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.productKey), keyBefore);
      await page.locator('.story-explore__scroll').evaluate(el => { el.scrollTop = 500; });
      assert.ok(await page.locator('.story-explore__scroll').evaluate(el => el.scrollTop) > 0);
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      const item = await page.evaluate(() => { const vm = document.querySelector('.story').__vue__; return { key: vm.products[12].key, label: vm.products[12].name + '، ' + vm.number(vm.priceFor(vm.products[12])) + ' تومان' }; });
      await page.getByRole('button', { name: item.label, exact: true }).click();
      assert.equal(await page.locator('.story-explore').count(), 0);
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.productKey), item.key);
      assert.equal(await page.evaluate(() => JSON.stringify(window.$nuxt.$store.getters['basket/counts'])), saved.counts);
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.story-explore').count(), 0);
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      await page.getByRole('button', { name: 'بازگشت به محصول', exact: true }).click();
      assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.productKey), item.key);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      assert.equal(await page.locator('video').evaluate(v => v.paused), true);
      assert.equal(creates, 0); assert.deepEqual(errors, []);
      console.log('PASS', viewport.width, theme, 'drag, halo, grid columns/scroll/select/back, shared counts and paused video');
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
