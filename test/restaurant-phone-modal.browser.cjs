// Focused local-only regression. Uses the existing runtime; never creates orders.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3333';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname));
const output = path.resolve(__dirname, '../.playwright-mcp/restaurant-phone-modal');
fs.mkdirSync(output, { recursive: true });
const helper = 'برای مشاهده کدهای تخفیف خود ابتدا شماره همراه خود را وارد و تأیید نمایید.';
const main = '.rc-checkout-dialog .modal-content';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function settled(page) {
  await page.waitForFunction(() => {
    const c = document.querySelector('.restaurant-checkout')?.__vue__;
    return c && !c.state.quoting && !!c.state.bill;
  });
}
async function open(page) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('.laviz-user-bar__login').click();
  await page.locator('input[name="mobile"]:visible').fill('09000000001');
  await page.locator('.auth-submit:visible').click();
  await page.locator('input[name="verify_code"]:visible').fill('12345');
  await page.locator('.auth-submit:visible').click();
  await page.waitForURL('**/restaurant-mock', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.$nuxt?.$store.getters['restaurantMockBasket/products'].some(p => !p.isOutOfStock && p.add_unit > 0));
  await page.evaluate(() => {
    const s = window.$nuxt.$store, p = s.getters['restaurantMockBasket/products'].find(p => !p.isOutOfStock && p.add_unit > 0);
    s.commit('restaurantMockBasket/increment', { key: p.key });
  });
  await page.locator('.story__cart').click();
  await page.locator('#restaurant-phone-verify').waitFor();
  await settled(page);
  await page.waitForTimeout(400); // Wait for the existing bottom-sheet entrance.
}
async function geometry(page) {
  return page.locator(main).evaluate(el => {
    const body = el.querySelector('.rc-body');
    const rect = n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const slots = {};
    for (const s of ['.rc-phone-group', '.rc-phone-feedback', '.rc-discount-helper', '.rc-quote-status', '.rc-table tfoot']) {
      const r = rect(el.querySelector(s)); r.y += body.scrollTop; slots[s] = r;
    }
    return { modal: rect(el), slots, scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth, viewportHeight: innerHeight };
  });
}
function sameGeometry(before, after, label, compareSlots = true) {
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(before.modal[key] - after.modal[key]) <= .6, `${label} modal ${key}: ${before.modal[key]} -> ${after.modal[key]}`);
  if (compareSlots) for (const selector of Object.keys(before.slots)) for (const key of ['y', 'height']) assert.ok(Math.abs(before.slots[selector][key] - after.slots[selector][key]) <= .6, `${label} ${selector} ${key}`);
  assert.ok(after.scrollWidth <= after.viewport, `${label} viewport overflow`);
  assert.ok(after.modal.y >= 0 && after.modal.y + after.modal.height <= after.viewportHeight + .6, `${label} viewport height`);
}
async function snapshot(page) {
  return page.locator('[data-checkout="checkout"]').evaluate(el => {
    const s = document.querySelector('.restaurant-checkout').__vue__.state;
    return { draft: JSON.stringify({ items: s.items, phone: s.phone, fulfilment: s.fulfilment, input: s.codeInput, code: s.discountCode }), scroll: el.closest('.rc-body').scrollTop };
  });
}
async function returned(page, expected) {
  await page.waitForFunction(() => !document.querySelector('[data-checkout="otp"]'));
  await page.waitForFunction(() => !document.querySelector('.rc-checkout-dialog').closest('.modal').inert);
  assert.equal(await page.evaluate(() => window.__checkoutNode === document.querySelector('[data-checkout="checkout"]')), true, 'same checkout DOM');
  const actual = await snapshot(page);
  assert.equal(actual.draft, expected.draft, 'draft preserved');
  const maximumScroll = await page.locator(main + ' .rc-body').evaluate(el => el.scrollHeight - el.clientHeight);
  assert.equal(actual.scroll, Math.min(expected.scroll, maximumScroll), 'scroll preserved within the new content bounds');
  assert.equal(await page.locator(main).isVisible(), true);
  assert.equal(await page.locator(main).evaluate(el => el.closest('.modal').parentElement.getAttribute('aria-hidden')), null);
  assert.equal(await page.locator('[role="dialog"][aria-modal="true"]').count(), 1);
  await page.waitForFunction(() => document.querySelector('[data-checkout="checkout"]').contains(document.activeElement));
}
async function startOtp(page) {
  await page.locator('#restaurant-phone-verify').scrollIntoViewIfNeeded();
  const saved = await snapshot(page);
  await page.locator('#restaurant-phone-verify').click();
  await page.locator('#restaurant-otp').waitFor();
  await page.waitForFunction(() => document.activeElement.id === 'restaurant-otp');
  assert.equal(await page.locator(main).isVisible(), true, 'main checkout visible behind OTP');
  assert.equal(await page.locator(main).evaluate(el => el.closest('.modal').inert), true);
  assert.equal(await page.locator(main).evaluate(el => el.closest('.modal').parentElement.getAttribute('aria-hidden')), 'true');
  assert.equal(await page.getByRole('dialog').count(), 1, 'only OTP exposed to accessibility');
  assert.equal(await page.evaluate(() => +getComputedStyle(document.querySelector('.rc-otp-dialog').closest('.modal').parentElement).zIndex > +getComputedStyle(document.querySelector('.rc-checkout-dialog').closest('.modal').parentElement).zIndex), true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('.rc-otp-dialog').contains(document.activeElement)), true, 'OTP focus trap');
  }
  return saved;
}
async function correctCode(page) {
  await page.waitForFunction(() => !document.querySelector('.restaurant-checkout').__vue__.state.identifying);
  await page.locator('#restaurant-otp').fill('246810');
  await page.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
  await page.locator('[data-checkout="otp"]').waitFor({ state: 'detached' });
}
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'chrome' }) });
  const report = [];
  try {
    for (const viewport of [{ width: 596, height: 1013 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
      if (process.env.CHECKOUT_CASE && process.env.CHECKOUT_CASE !== `${theme}-${viewport.width}`) continue;
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      try {
        await context.addInitScript(value => { localStorage.setItem('pwaCallOut', '1'); localStorage.setItem('theme', value); }, theme);
        const page = await context.newPage(), errors = [], requests = [], forbidden = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
          if (/\/checkout\/(online|confirmCard|cancel)$/.test(url.pathname) || /\/order\/(create|payment)/.test(url.pathname)) { forbidden.push(url.pathname); return route.abort(); }
          return route.continue();
        });
        page.on('request', r => { if (/\/checkout\//.test(r.url())) requests.push(new URL(r.url()).pathname); });
        await open(page);
        await page.evaluate(value => { document.documentElement.setAttribute('data-theme', value); window.__checkoutNode = document.querySelector('[data-checkout="checkout"]'); }, theme);
        const suffix = `${theme}-${viewport.width}x${viewport.height}`, samples = [];
        assert.equal(await page.locator('.rc-discount-helper').textContent(), helper);
        assert.equal(await page.locator('#restaurant-phone-verify').textContent(), 'تأیید شماره همراه');
        assert.equal(await page.locator('#restaurant-phone-verify').isDisabled(), true);
        assert.equal(await page.getByRole('button', { name: 'کارت میکشم', exact: true }).isDisabled(), true);
        const phone = page.locator('#restaurant-phone');
        await phone.focus(); await phone.blur(); await phone.focus();
        const base = await geometry(page);
        // Slow the existing quote to measure debounce, in-flight and settled states separately.
        await page.route('**/checkout/preview', async route => { await wait(350); await route.continue(); });
        for (let i = 0; i <= 22; i++) {
          if (i > 0 && i <= 11) await phone.press('09123456789'[i - 1]);
          if (i > 11) await phone.press('Backspace');
          const entry = { phone: await phone.inputValue(), stages: {} };
          for (const [stage, delay] of [['immediate', 0], ['loading', 230], ['settled', 400]]) {
            if (delay) await page.waitForTimeout(delay);
            entry.stages[stage] = await geometry(page);
            sameGeometry(base, entry.stages[stage], `${suffix} ${i} ${stage}`);
          }
          samples.push(entry);
        }
        assert.equal(requests.filter(x => x.endsWith('/challenge')).length, 0, 'typing never sends OTP');
        await page.unroute('**/checkout/preview');
        // Quote failure and retry retain the same reserved space.
        await page.route('**/checkout/preview', route => route.fulfill({ status: 503, json: { message: 'fixture' } }));
        await phone.fill('09123456789');
        await page.locator('.rc-checkout-error').filter({ hasText: 'درخواست انجام نشد.' }).waitFor();
        const failed = await geometry(page); sameGeometry(base, failed, suffix + ' quote error', false);
        fs.writeFileSync(path.join(output, `digits-${suffix}.json`), JSON.stringify({ base, samples, failed }, null, 2));
        await page.unroute('**/checkout/preview'); await page.locator('.rc-quote-retry').click(); await settled(page);
        sameGeometry(base, await geometry(page), suffix + ' retry', false);
        assert.deepEqual(await page.locator('#restaurant-phone-verify').evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]), ['rgb(138, 19, 24)', 'rgb(255, 255, 255)']);
        assert.equal(await page.locator('.rc-table thead th').count(), 4);
        assert.equal(await page.locator('.rc-table tfoot tr').count(), 4);
        assert.equal(await page.locator('.rc-table tbody tr').count(), 1);
        assert.notEqual(await page.locator('.rc-dine-icon').evaluate(el => getComputedStyle(el).maskImage), 'none');
        assert.notEqual(await page.locator('.rc-takeaway-icon').evaluate(el => getComputedStyle(el).maskImage), 'none');
        assert.notEqual(await page.locator('.rc-takeaway-icon').evaluate(el => getComputedStyle(el).maskImage), await page.locator('.rc-dine-icon').evaluate(el => getComputedStyle(el).maskImage));
        await page.locator(main + ' .rc-body').evaluate(el => { el.scrollTop = 0; });
        await page.screenshot({ path: path.join(output, `fulfilment-${suffix}.png`) });
        await page.locator('input[name="restaurant-fulfilment"][value="dine_in"]').check();
        assert.equal(await page.locator('input[name="restaurant-fulfilment"][value="dine_in"]').isChecked(), true);
        await page.locator('input[name="restaurant-fulfilment"][value="takeaway"]').check();
        await settled(page);
        assert.equal(await page.locator('.rc-checkout-error, .rc-quote-retry').count(), 0);
        const footerPositions = [];
        for (const position of [0, .5, 1]) {
          await page.locator(main + ' .rc-body').evaluate((el, fraction) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * fraction; }, position);
          footerPositions.push(await page.locator('.rc-payment-options').boundingBox());
        }
        for (const box of footerPositions) assert.deepEqual(box, footerPositions[0], 'payment footer remains fixed');
        const summaryStyle = await page.locator('.rc-table').evaluate(el => [getComputedStyle(el.querySelector('tbody')).backgroundColor, getComputedStyle(el.querySelector('tfoot')).backgroundColor]);
        assert.notEqual(summaryStyle[0], summaryStyle[1]);
        assert.equal(await page.locator('.rc-table tfoot tr:last-child').evaluate(el => { const r = el.getBoundingClientRect(), b = el.closest('.rc-body').getBoundingClientRect(); return r.bottom <= b.bottom + .6; }), true, 'last summary row reachable');
        assert.equal(await page.locator('.rc-table').evaluate(el => !!(el.compareDocumentPosition(document.querySelector('.rc-payment-options')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
        for (const close of await page.locator('.b-toast .close:visible').all()) await close.click();
        const inputRect = await phone.boundingBox(), verifyRect = await page.locator('#restaurant-phone-verify').boundingBox();
        assert.ok(verifyRect.x + verifyRect.width <= inputRect.x + .6, 'verification left of input');
        const alignment = await page.locator('.rc-stepper').first().evaluate(el => {
          const cell = el.closest('td'), button = el.querySelector('button'), r = cell.getBoundingClientRect(), b = button.getBoundingClientRect();
          return { gap: r.right - parseFloat(getComputedStyle(cell).paddingRight) - b.right, direction: getComputedStyle(el).direction, minus: button.textContent };
        });
        assert.ok(Math.abs(alignment.gap) <= .6); assert.equal(alignment.direction, 'rtl'); assert.equal(alignment.minus, '−');
        const count = await page.locator('.rc-stepper bdi').first().textContent();
        await page.locator('.rc-stepper').first().getByRole('button', { name: /^افزودن/ }).click(); await settled(page);
        assert.notEqual(await page.locator('.rc-stepper bdi').first().textContent(), count);
        await page.locator('.rc-stepper').first().getByRole('button', { name: /^کم کردن/ }).click(); await settled(page);
        assert.equal(await page.locator('.rc-stepper bdi').first().textContent(), count);
        // Both payment choices work without customer verification; no transaction is sent.
        assert.equal(await page.getByRole('button', { name: 'پرداخت آنلاین', exact: true }).isEnabled(), true);
        await page.locator('input[name="restaurant-discount"]').fill('WELCOME'); await page.locator('.rc-code button').click(); await settled(page);
        assert.equal(await page.locator('.rc-applied').count(), 1, 'public manual code works unverified');
        await page.locator('input[name="restaurant-discount"]').fill('DRAFT');
        await page.getByLabel('بیرون بر', { exact: true }).check(); await settled(page);
        await page.evaluate(() => { window.__checkoutNode = document.querySelector('[data-checkout="checkout"]'); });
        const saved = await startOtp(page);
        await page.screenshot({ path: path.join(output, `stacked-${suffix}.png`) });
        await page.waitForFunction(() => !document.querySelector('.restaurant-checkout').__vue__.state.identifying);
        await page.locator('#restaurant-otp').fill('000000');
        await page.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
        await page.locator('[data-checkout="otp"] .rc-error').waitFor();
        assert.equal(await page.locator('.offer-card').count(), 0);
        await page.locator('#restaurant-otp').fill('1');
        await page.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
        await page.getByText('کد تأیید را کامل وارد کنید.', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'بازگشت به سبد خرید', exact: true }).click(); await returned(page, saved);
        const sent = requests.filter(x => x.endsWith('/challenge')).length;
        const again = await startOtp(page); await page.keyboard.press('Escape'); await returned(page, again);
        assert.equal(requests.filter(x => x.endsWith('/challenge')).length, sent, 'reopen within cooldown does not send OTP');
        const success = await startOtp(page); await correctCode(page); await returned(page, success);
        assert.equal(await page.locator('.rc-discount-helper').count(), 0);
        assert.equal(await page.locator('.offer-card').count(), 1, 'existing cart card renderer');
        await page.locator('.offer-card').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `verified-${suffix}.png`) });
        await page.locator('.offer-card__apply').click(); await settled(page);
        await page.getByText('کد PERSONAL10 اعمال شد.', { exact: true }).waitFor();
        await phone.fill('09123456780');
        assert.equal(await page.locator('.rc-discount-helper').count(), 1);
        assert.equal(await page.locator('.offer-card').count(), 0);
        assert.equal(await page.locator('.rc-applied').count(), 0);
        assert.equal(await page.locator('input[name="restaurant-discount"]').inputValue(), '');
        await settled(page);
        await page.route('**/checkout/discounts', route => route.fulfill({ json: [] }));
        const empty = await startOtp(page); await correctCode(page); await returned(page, empty);
        await page.getByText('کد تخفیفی در حال حاضر برای شما وجود ندارد', { exact: true }).waitFor();
        await page.getByText('کد تخفیفی در حال حاضر برای شما وجود ندارد', { exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `empty-${suffix}.png`) });
        await page.locator('.rc-payment-options').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `totals-${suffix}.png`) });
        for (const selector of ['#restaurant-phone', '#restaurant-phone-verify', '.rc-stepper button', '.rc-code input', '.rc-code button', '.rc-payment-options button']) for (const control of await page.locator(selector).all()) {
          await control.scrollIntoViewIfNeeded();
          assert.equal(await control.evaluate(el => { const r = el.getBoundingClientRect(), b = el.closest('.rc-body, .rc-checkout-footer').getBoundingClientRect(); return r.top >= b.top - .6 && r.bottom <= b.bottom + .6 && r.left >= b.left - .6 && r.right <= b.right + .6; }), true, selector + ' reachable without clipping');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, basket: window.$nuxt.$store.state.basket }));
        assert.equal(/0912345678|PERSONAL10|246810|DRAFT/.test(storage), false);
        assert.deepEqual(forbidden, []); assert.deepEqual(errors, []);
        report.push({ viewport, theme, samples, failed, alignment, challengeCount: requests.filter(x => x.endsWith('/challenge')).length, forbidden, errors });
        fs.writeFileSync(path.join(output, 'geometry.json'), JSON.stringify(report, null, 2));
        console.log(`PASS ${suffix}: 23 phone states × 3 quote stages, error/retry, right alignment, optional verification, stacked OTP/wrong/cancel/Escape/cards/empty, no transaction`);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
