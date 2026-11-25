const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const sampleKey = '4e42e4c2-3e27-4e98-9244-9e268c30132a';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [587, 390]) {
      const touch = width === 390;
      const context = await browser.newContext({ viewport: { width, height: touch ? 844 : 781 }, hasTouch: touch, isMobile: touch });
      await context.addInitScript(() => localStorage.setItem('pwaCallOut', '1'));
      const page = await context.newPage(); const errors = []; let requests = 0; let release;
      const gate = new Promise(resolve => { release = resolve; });
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/shawarma-demo.mp4', async route => { requests++; await gate; await route.continue(); });
      await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' });
      await page.locator('.story__details h1').waitFor({ timeout: 45000 });
      await page.locator('.local-story-poster').waitFor();
      await page.waitForFunction(() => { const img = document.querySelector('.local-story-poster'); return img && img.naturalWidth > 0; });
      assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).opacity), '0');
      if (process.env.DRAG_SHOTS) await page.screenshot({ path: '.local-dev/media-pending-' + width + '.png' });
      release();
      await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.currentTime > .1 && +getComputedStyle(v).opacity === 1; }, null, { timeout: 15000 });
      const cdp = touch ? await context.newCDPSession(page) : null;
      const box = await page.locator('.story__swipe').boundingBox(); const y = Math.round(box.y + box.height / 2);
      const start = async x => touch ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] }) : (await page.mouse.move(x, y), page.mouse.down());
      const slide = async x => touch ? cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 0 }] }) : page.mouse.move(x, y, { steps: 5 });
      const end = async () => touch ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : page.mouse.up();
      const waitIdle = () => page.waitForFunction(() => document.querySelector('.story').__vue__.motionPhase === 'idle');
      const index = () => page.evaluate(() => document.querySelector('.story').__vue__.index);
      const stable = await page.locator('.story__cart').boundingBox();
      await start(Math.round(width * .25)); await slide(Math.round(width * .65));
      const movement = await page.evaluate(() => { const x = q => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(q)).transform).m41; return { image: x('.story__photo'), card: x('.story__details:not(.story__incoming-details)'), incoming: x('.story__incoming-photo') }; });
      assert.ok(movement.image > 50); assert.equal(movement.image, movement.card); assert.ok(movement.incoming < 0);
      assert.deepEqual(await page.locator('.story__cart').boundingBox(), stable);
      if (process.env.DRAG_SHOTS) await page.screenshot({ path: '.local-dev/drag-progress-' + width + '.png' });
      await end(); await waitIdle(); assert.equal(await index(), 1, 'right drag is next');
      await start(Math.round(width * .65)); await slide(Math.round(width * .25)); await end(); await waitIdle(); assert.equal(await index(), 0, 'left drag is previous');
      await start(Math.round(width * .4)); await slide(Math.round(width * .4) + 25); await end(); await waitIdle(); assert.equal(await index(), 0, 'short drag cancels');
      assert.equal(await page.locator('.story__photo').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41), 0);
      await start(Math.round(width * .3)); await slide(Math.round(width * .6));
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      else { await page.locator('.story__swipe').dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up(); }
      await waitIdle(); assert.equal(await index(), 0);
      await start(Math.round(width * .65)); await slide(Math.round(width * .25)); await end(); await waitIdle(); assert.equal(await index(), 0, 'first boundary');
      await page.getByRole('button', { name: 'محصول بعدی', exact: true }).click(); await waitIdle(); assert.equal(await index(), 1);
      await page.keyboard.press('ArrowRight'); await waitIdle(); assert.equal(await index(), 0);
      await page.keyboard.press('ArrowLeft'); await waitIdle(); assert.equal(await index(), 1);
      await page.keyboard.press('ArrowRight'); await waitIdle();
      await page.locator('.story__add').click();
      const counts = await page.evaluate(() => JSON.stringify(window.$nuxt.$store.getters['basket/counts']));
      await page.getByRole('button', { name: 'نمایش همهٔ غذاها', exact: true }).click();
      assert.equal(await page.locator('video').evaluate(v => v.paused), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => JSON.stringify(window.$nuxt.$store.getters['basket/counts'])), counts);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.keyboard.press('ArrowLeft'); assert.equal(await index(), 1); await page.keyboard.press('ArrowRight'); assert.equal(await index(), 0);
      await page.evaluate(() => { const vm = document.querySelector('.story').__vue__; vm.setProduct(vm.products[vm.products.length - 1]); });
      const last = await index(); await start(Math.round(width * .25)); await slide(Math.round(width * .65)); await end(); await waitIdle(); assert.equal(await index(), last);
      assert.deepEqual(errors, []);
      console.log('PASS', width, touch ? 'touch' : 'mouse', { movement, mediaRequests: requests }, 'direction, settle/cancel, boundaries, arrows, grid/counts, reduced motion, delayed poster/decoded frame');
      await context.close();
    }
    // Start on a non-video product. The configured sample must request in the background.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage();
    await page.route('**/api/enduser/core/initialize', async route => {
      const response = await route.fetch(); const data = await response.json();
      const sample = data.products.find(p => p.key === sampleKey); const i = data.products.indexOf(sample); data.products.splice(i, 1); data.products.push(sample);
      await route.fulfill({ response, json: data });
    });
    let preloaded = false;
    await page.route('**/shawarma-demo.mp4', route => { preloaded = true; return route.abort('failed'); });
    await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' }); await page.locator('.story__details h1').waitFor();
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.error; });
    assert.ok(preloaded); assert.notEqual(await page.evaluate(() => document.querySelector('.story').__vue__.productKey), sampleKey);
    await page.evaluate(key => { const vm = document.querySelector('.story').__vue__; vm.setProduct(vm.products.find(p => p.key === key)); }, sampleKey);
    await page.locator('.local-story-poster').waitFor(); assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).opacity), '0');
    console.log('PASS background sample request before activation and failed-video poster fallback'); await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
