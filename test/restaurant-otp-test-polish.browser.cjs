// Run with Playwright MCP browser_run_code_unsafe(filename). Existing runtime only.
// Four bounded cases; no SMS, payment or order submission.
async function restaurantOtpTestPolish(page) {
  const assert = (value, label) => { if (!value) throw Error(label); };
  const browser = page.context().browser(), results = [];
  const output = 'D:/lovizefood/.playwright-mcp/restaurant-otp-test-polish/';
  for (const viewport of [{ width: 759, height: 881 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    let p, stage = 'initial';
    try {
      await context.addInitScript(value => { localStorage.setItem('pwaCallOut', '1'); localStorage.setItem('theme', value); }, theme);
      p = await context.newPage(); p.setDefaultTimeout(10000);
      const errors = [], forbidden = [], calls = []; let opened = 0;
      p.on('pageerror', e => errors.push(e.message));
      await p.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
        if (/\/checkout\/(online|confirmCard|cancel)$|\/order\/(create|payment)/.test(url.pathname)) { forbidden.push(url.pathname); return route.abort(); }
        return route.continue();
      });
      p.on('request', r => { if (/\/checkout\//.test(r.url())) calls.push(new URL(r.url()).pathname.split('/').pop()); });
      const settled = () => p.waitForFunction(() => { const c = document.querySelector('.restaurant-checkout')?.__vue__; return c && !c.state.quoting && !!c.state.bill; });
      const draft = () => p.evaluate(() => {
        const c = document.querySelector('.restaurant-checkout').__vue__, s = c.state;
        return { value: JSON.stringify({ items: s.items, phone: s.phone, fulfilment: s.fulfilment, input: s.codeInput, code: s.discountCode }),
          scroll: document.querySelector('.rc-checkout-dialog .rc-body').scrollTop };
      });
      const returned = async saved => {
        stage = 'return/focus';
        await p.locator('#restaurant-otp').waitFor({ state: 'detached' });
        await p.waitForFunction(() => {
          const modal = document.querySelector('.rc-checkout-dialog')?.closest('.modal');
          return modal && !modal.inert && !modal.parentElement.inert && modal.contains(document.activeElement);
        });
        assert(await p.evaluate(() => window.__checkoutNode === document.querySelector('[data-checkout="checkout"]')), 'checkout DOM replaced');
        const actual = await draft();
        assert(actual.value === saved.value && Math.abs(actual.scroll - saved.scroll) < .6, 'draft/scroll changed');
        assert(await p.locator('[data-checkout="checkout"]').isVisible(), 'checkout hidden');
        assert(await p.getByRole('dialog').count() === 1, 'incorrect accessibility modal stack');
      };
      const startOtp = async () => {
        stage = 'open OTP/focus #' + ++opened;
        await p.locator('#restaurant-phone-verify').scrollIntoViewIfNeeded();
        const saved = await draft();
        await p.locator('#restaurant-phone-verify').click();
        await p.waitForFunction(() => document.querySelector('.rc-otp-dialog')?.contains(document.activeElement) && !document.querySelector('.restaurant-checkout').__vue__.state.identifying);
        assert(await p.locator('[data-checkout="checkout"]').isVisible(), 'checkout not visible under OTP');
        assert(await p.locator('.rc-checkout-dialog').evaluate(el => el.closest('.modal').inert && el.closest('.modal').parentElement.inert), 'checkout not inert');
        assert(await p.getByRole('dialog').count() === 1, 'only top dialog should be exposed');
        for (let i = 0; i < 5; i++) {
          await p.keyboard.press('Tab');
          assert(await p.evaluate(() => document.querySelector('.rc-otp-dialog').contains(document.activeElement)), 'focus escaped OTP');
        }
        return saved;
      };
      const outside = async () => {
        // Real pointer click on the top modal's outside area, never a close API.
        assert(await p.evaluate(() => document.elementFromPoint(2, 2)?.classList.contains('modal')), 'outside point is not the modal backdrop');
        await p.mouse.click(2, 2);
      };
      await p.goto('http://127.0.0.1:3333/', { waitUntil: 'domcontentloaded' });
      await p.locator('.laviz-user-bar__login').click();
      await p.locator('input[name="mobile"]:visible').fill('09000000001');
      await p.locator('.auth-submit:visible').click();
      await p.locator('input[name="verify_code"]:visible').fill('12345');
      await p.locator('.auth-submit:visible').click();
      await p.waitForURL('**/restaurant-mock');
      await p.waitForFunction(() => window.$nuxt?.$store.getters['restaurantMockBasket/products'].some(p => !p.isOutOfStock && p.add_unit > 0));
      await p.evaluate(value => {
        document.documentElement.setAttribute('data-theme', value);
        const s = window.$nuxt.$store, item = s.getters['restaurantMockBasket/products'].find(p => !p.isOutOfStock && p.add_unit > 0);
        s.commit('restaurantMockBasket/increment', { key: item.key });
      }, theme);
      await p.locator('.story__cart').click(); await p.locator('#restaurant-phone').waitFor(); await settled();
      await p.evaluate(() => { window.__checkoutNode = document.querySelector('[data-checkout="checkout"]'); });
      const suffix = theme + '-' + viewport.width + 'x' + viewport.height;
      const colors = await p.locator('#restaurant-phone').evaluate(el => ({
        entered: getComputedStyle(el).color, placeholder: getComputedStyle(el, '::placeholder').color,
        opacity: +getComputedStyle(el, '::placeholder').opacity, background: getComputedStyle(el).backgroundColor,
        otherPlaceholderOpacity: +getComputedStyle(document.querySelector('input[name="restaurant-discount"]'), '::placeholder').opacity,
      }));
      assert(colors.opacity === .35 && colors.otherPlaceholderOpacity === 1, 'placeholder scope/opacity');
      assert(colors.entered !== colors.placeholder, 'placeholder same as entered text');
      await p.locator('#restaurant-phone').scrollIntoViewIfNeeded();
      await p.screenshot({ path: output + 'placeholder-' + suffix + '.png' });
      stage = 'typed phone/quote';
      await p.locator('#restaurant-phone').fill('09123456789'); await settled();
      assert(await p.locator('#restaurant-phone').evaluate(el => getComputedStyle(el).color) === colors.entered, 'typed color changed');
      await p.getByLabel('بیرون بر', { exact: true }).check(); await settled();
      await p.locator('input[name="restaurant-discount"]').fill('WELCOME'); await p.locator('.rc-code button').click(); await settled();
      await p.locator('input[name="restaurant-discount"]').fill('DRAFT');
      // Checkout backdrop guard still holds.
      await outside(); assert(await p.locator('#restaurant-phone').count() === 1, 'checkout backdrop closed cart');
      let saved = await startOtp();
      const testCode = await p.locator('#restaurant-otp').inputValue();
      assert(testCode === '246810', 'must prefill the existing mock challenge code');
      assert(!calls.includes('verify') && !calls.includes('discounts'), 'prefill auto verified');
      await p.screenshot({ path: output + 'prefilled-' + suffix + '.png' });
      await outside(); await returned(saved);
      assert(await p.locator('#restaurant-phone-verify').evaluate(el => el === document.activeElement), 'focus not restored to opener');
      const challengeCount = calls.filter(x => x === 'challenge').length;
      saved = await startOtp(); await p.keyboard.press('Escape'); await returned(saved);
      saved = await startOtp(); await p.getByRole('button', { name: 'بازگشت به سبد خرید', exact: true }).click(); await returned(saved);
      assert(calls.filter(x => x === 'challenge').length === challengeCount, 'reopen sent an unnecessary OTP');
      saved = await startOtp();
      await p.locator('#restaurant-otp').fill('000000');
      await p.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
      await p.locator('[data-checkout="otp"] .rc-error').waitFor();
      assert(await p.locator('.offer-card').count() === 0, 'wrong OTP revealed cards');
      await outside(); await returned(saved);
      saved = await startOtp(); assert(await p.locator('#restaurant-otp').inputValue() === testCode, 'reopen lost local prefill');
      await p.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
      await returned(saved); assert(await p.locator('.offer-card').count() === 1, 'normal verify failed');
      await p.locator('.offer-card').scrollIntoViewIfNeeded();
      await p.screenshot({ path: output + 'verified-' + suffix + '.png' });
      // Consume OTP on the mock server, but hold the response until after dismiss.
      await p.locator('#restaurant-phone').fill('09123456780'); await settled();
      let release, received, finished;
      const held = new Promise(resolve => { release = resolve; });
      const started = new Promise(resolve => { received = resolve; });
      const done = new Promise(resolve => { finished = resolve; });
      await p.route('**/checkout/verify', async route => {
        const response = await route.fetch(); received();
        await held; await route.fulfill({ response }); finished();
      });
      saved = await startOtp();
      await p.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
      await started; await outside(); await returned(saved); await settled();
      const before = calls.filter(x => x === 'discounts').length;
      release(); await done; await p.waitForTimeout(150);
      assert(await p.locator('.offer-card').count() === 0, 'late verify exposed cards');
      assert(await p.evaluate(() => {
        const s = document.querySelector('.restaurant-checkout').__vue__.state;
        return s.phase === 'checkout' && !s.verified && !s.identifying && !s.codes.length && !s.otp;
      }), 'late result changed private state');
      assert(calls.filter(x => x === 'discounts').length === before, 'late verify fetched private discounts');
      await p.screenshot({ path: output + 'dismissed-late-' + suffix + '.png' });
      await p.unroute('**/checkout/verify');
      saved = await startOtp(); assert(await p.locator('#restaurant-otp').inputValue() === testCode, 'fresh cycle prefill');
      await p.getByRole('button', { name: 'تأیید کد و مشاهده تخفیف‌ها', exact: true }).click();
      await returned(saved); assert(await p.locator('.offer-card').count() === 1, 'fresh cycle normal verify');
      // Exercise the same reusable component with a generic adapter: no prefill
      // even though its test-only transport still returns a mock challenge.
      await p.evaluate(() => {
        const c = document.querySelector('.restaurant-checkout').__vue__;
        const generic = { ...c.adapter }; delete generic.localOnly; delete generic.otpPrefill;
        const fresh = c.$options.data.call({ adapter: generic, items: c.items, $emit: () => {} });
        c.checkout.destroy(); c.checkout = fresh.checkout; c.state = fresh.state;
      });
      await p.locator('#restaurant-phone').fill('09123456789'); await settled();
      saved = await startOtp(); assert(await p.locator('#restaurant-otp').inputValue() === '', 'generic component prefilled a fixed code');
      await outside(); await returned(saved);
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow');
      const storage = await p.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
      assert(!/0912345678|246810|PERSONAL10|DRAFT/.test(storage), 'private data persisted');
      assert(errors.length === 0, 'page errors: ' + errors.join('; '));
      assert(forbidden.length === 0, 'transaction attempted');
      results.push({ viewport, theme, colors, testCode, requests: calls, forbidden, errors,
        pass: ['scoped placeholder/typed color', 'local prefill/no auto verify', 'wrong code rejected',
          'normal verify', 'actual outside/Escape/back preserve DOM/draft/scroll/focus',
          'inert/focus trap', 'dismiss consumed in-flight verify/ignore late response/reopen',
          'generic component empty', 'checkout backdrop guard', 'no private storage/transactions/overflow'] });
    } catch (error) {
      if (p) {
        await p.screenshot({ path: output + 'failure-' + theme + '-' + viewport.width + '.png' });
        const info = await p.evaluate(() => {
          const s = document.querySelector('.restaurant-checkout')?.__vue__?.state;
          const modal = document.querySelector('.rc-checkout-dialog')?.closest('.modal');
          return { state: s, focus: document.activeElement?.outerHTML.slice(0,250),
            modal: modal?.outerHTML.slice(0,650), parent: modal?.parentElement.outerHTML.slice(0,650),
            button: document.querySelector('#restaurant-phone-verify')?.outerHTML };
        });
        throw Error(stage + ': ' + error.message + '\n' + JSON.stringify(info));
      }
      throw error;
    } finally { await context.close(); }
  }
  return results;
}
