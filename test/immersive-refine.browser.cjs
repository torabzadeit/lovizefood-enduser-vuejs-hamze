const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of [{ width: 587, height: 781 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(() => localStorage.setItem('pwaCallOut', '1'));
      const page = await context.newPage(); const errors = []; let creates = 0;
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', r => { if (r.url().includes('/order/create')) creates++; });
      await page.goto(origin + '/immersive-menu', { waitUntil: 'domcontentloaded' });
      await page.locator('.story__details h1').waitFor({ timeout: 60000 });
      await page.waitForFunction(() => { const v = document.querySelector('.local-story-video'); return v && v.readyState >= 2 && !v.paused; }, null, { timeout: 45000 });
      const initial = await page.locator('video').evaluate(v => ({ time: v.currentTime, ready: v.readyState, muted: v.muted, inline: v.playsInline, loop: v.loop, width: v.videoWidth }));
      assert.ok(initial.muted && initial.inline && initial.loop);
      assert.ok(initial.width <= 720, 'local demo must use the optimized rendition');
      await page.waitForFunction(t => document.querySelector('video').currentTime > t + .3, initial.time);
      assert.equal(await page.locator('.lcp-trigger').isVisible(), false);
      await page.locator('.story__add').click();
      const plus = page.locator('.story__quantity button[aria-label="افزودن"]');
      const minus = page.locator('.story__quantity button[aria-label="کم کردن"]');
      assert.ok((await plus.boundingBox()).x < (await minus.boundingBox()).x);
      const count = await page.evaluate(() => document.querySelector('.story').__vue__.count);
      await plus.click(); assert.ok(await page.evaluate(() => document.querySelector('.story').__vue__.count) > count);
      await minus.click(); assert.equal(await page.evaluate(() => document.querySelector('.story').__vue__.count), count);
      assert.equal(await page.locator('.story__cart-label img').getAttribute('src'), await page.locator('.story__back img').getAttribute('src'));
      assert.equal(await page.locator('.story__cart-label img').evaluate(el => getComputedStyle(el).transform), 'none');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      assert.equal(await page.locator('video').evaluate(v => v.paused), true);
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForFunction(() => !document.querySelector('video').paused);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('video').paused);
      assert.equal(await page.locator('video').isVisible(), false);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(() => !document.querySelector('video').paused);
      await page.getByRole('button', { name: 'محصول بعدی', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('video').paused);
      assert.equal(await page.locator('video').isVisible(), false, 'demo must belong only to configured local item');
      await page.getByRole('button', { name: 'بازگشت به منوی اصلی', exact: true }).click();
      await page.locator('.laviz-storefront-shell').waitFor();
      assert.equal(await page.locator('video.local-story-video').count(), 0, 'leaving story destroys local player');
      assert.equal(await page.locator('.lcp-trigger').isVisible(), false);
      assert.equal(creates, 0); assert.deepEqual(errors, []);
      console.log('PASS', viewport, 'video metadata', initial, 'playback, visibility, reduced motion, signs, arrow and preview trigger');
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
