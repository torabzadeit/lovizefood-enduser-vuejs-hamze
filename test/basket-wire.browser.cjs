const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const addresses = [{ id: 'wire-default', title: 'منزل', address: 'نشانی پیش‌فرض', lat: 35.7, lng: 51.4, isDefault: true }];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const loggedIn of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(auth => {
        localStorage.setItem('pwaCallOut', '1');
        if (auth) {
          localStorage.setItem('token', 'mock-token');
          localStorage.setItem('user', JSON.stringify({ id: 'mock-user', first_name: 'نمونه' }));
        }
      }, loggedIn);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let creates = 0;
      page.on('request', req => { if (req.url().endsWith('/api/enduser/order/create')) creates++; });
      await page.route('**/api/enduser/profile/addresses', route => route.fulfill({ json: addresses }));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        const vm = document.querySelector('.laviz-storefront-shell')?.__vue__;
        return vm && vm.addressesInitialized && !vm.loading && vm.products.length;
      });
      const api = new URL(await page.evaluate(() => window.$nuxt.$axios.defaults.baseURL));
      assert.ok(['localhost', '127.0.0.1'].includes(api.hostname) && api.port === (process.env.TEST_API_PORT || '3003'), 'fixtures only against the explicitly selected local mock');
      if (loggedIn) {
        await page.waitForFunction(() => document.querySelector('.laviz-storefront-shell').__vue__.selectedAddressId === 'wire-default');
        await page.evaluate(async () => {
          const vm = document.querySelector('.laviz-storefront-shell').__vue__;
          await vm.loadMyDiscountCodes();
          vm.autoOfferQueue = []; vm.autoOffer = null;
        });
        await page.locator('.osheet').waitFor({ state: 'hidden' });
      }
      // A real menu click, followed by the same stepper used in checkout.
      await page.locator('.product-card__add:visible').first().click();
      const before = await page.evaluate(async auth => {
        const vm = document.querySelector('.laviz-storefront-shell').__vue__;
        const key = vm.selectedProducts[0].key;
        vm.onCartStep(key, 1);
        vm.delivery_address = 'نشانی دستی'; vm.plaque = '۱۲'; vm.onManualAddressInput();
        vm.delivery_lat = 36; vm.delivery_lng = 52;
        if (auth) {
          await vm.loadMyDiscountCodes();
          vm.discountCode.code = vm.myActiveCodes[0].code;
          await vm.approveDiscountCode();
        }
        await vm.$nextTick();
        const saved = { key, count: vm.productData[key].count, bill: { ...vm.bill }, code: { ...vm.discountCode } };
        await vm.initialize();
        if (vm.productData[key].count !== saved.count) throw Error('initialize reset quantity');
        // The real immersive route now exists; verify its roundtrip instead
        // of the temporary route stub used before that page was implemented.
        await vm.$router.push('/immersive-menu');
        return saved;
      }, loggedIn);
      await page.locator('.story__details h1').waitFor();
      const story = await page.evaluate(async key => {
        const store = window.$nuxt.$store;
        store.commit('basket/increment', { key });
        const count = store.getters['basket/counts'][key];
        await store.dispatch('basket/requestCheckout', { categoryId: store.state.basket.categories[0].id, productKey: key });
        const estimate = store.getters['basket/estimatedBill'];
        const publicState = JSON.stringify(store.state);
        await window.$nuxt.$router.push('/');
        return { count, estimate, publicState };
      }, before.key);
      await page.waitForFunction(() => {
        const vm = document.querySelector('.laviz-storefront-shell')?.__vue__;
        return vm && vm.addressesInitialized && !vm.loading;
      });
      const after = await page.evaluate(async key => {
        const vm = document.querySelector('.laviz-storefront-shell').__vue__;
        await vm.$nextTick();
        return { count: vm.productData[key].count, address: vm.delivery_address, plaque: vm.plaque,
          manual: vm.addressOverridden, code: { ...vm.discountCode }, cart: vm.cartOpen,
          pendingLogin: vm.pendingContinue, intent: vm.$store.state.basket.checkoutIntent,
          consumeAgain: await vm.$store.dispatch('basket/consumeCheckoutIntent') };
      }, before.key);
      assert.equal(after.count, story.count);
      assert.equal(after.address, 'نشانی دستی');
      assert.equal(after.plaque, '۱۲');
      assert.equal(after.manual, true);
      assert.equal(after.intent, false);
      assert.equal(after.consumeAgain, false);
      assert.equal(after.cart, loggedIn);
      assert.equal(after.pendingLogin, !loggedIn);
      if (loggedIn) {
        assert.equal(after.code.code_valid_status, true);
        assert.deepEqual(after.code, before.code);
      }
      assert.doesNotMatch(story.publicState, /نشانی دستی|نشانی پیش‌فرض|mock-token|discountCode|bankCardNumber|savedAddresses/);
      // Ordinary checkout still reaches preview, never create/payment.
      if (loggedIn) {
        const preview = page.waitForResponse(r => r.url().endsWith('/api/enduser/order/preview') && r.request().method() === 'POST');
        await page.evaluate(async () => {
          const vm = document.querySelector('.laviz-storefront-shell').__vue__;
          await vm.order();
        });
        assert.equal((await preview).status(), 200);
        await page.locator('#modal-bill.show').waitFor();
      }
      assert.equal(creates, 0);
      assert.deepEqual(errors, []);
      console.log(`PASS ${loggedIn ? 'customer' : 'guest'} menu/stepper, reinit, router roundtrip, manual address, one-shot intent${loggedIn ? ', coupon and normal preview' : ', login gate'}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
