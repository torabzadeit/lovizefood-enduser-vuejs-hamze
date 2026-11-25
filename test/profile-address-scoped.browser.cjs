const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test-customer', first_name: 'آزمایش' }));
    });
    const page = await context.newPage();
    const addresses = [
      { id: 'one', title: 'منزل', address: 'نشانی یک', lat: 35.7, lng: 51.4, isDefault: true },
      { id: 'two', title: 'کار', address: 'نشانی دو', lat: 35.8, lng: 51.5, isDefault: false },
    ];
    await page.route('**/api/enduser/profile/addresses', r => r.fulfill({ json: addresses }));
    await page.goto('http://localhost:3333/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.laviz-storefront-shell')?.__vue__?.addressesInitialized);
    await page.waitForFunction(() => document.querySelector('.laviz-storefront-shell').__vue__.selectedAddressId === 'one');
    const result = await page.evaluate(async () => {
      const vm = document.querySelector('.laviz-storefront-shell').__vue__;
      const initial = [vm.delivery_address, vm.selectedAddressTitle, vm.delivery_lat, vm.delivery_lng, vm.plaque];
      vm.pickSavedAddress(vm.savedAddresses[1]);
      await vm.refreshSavedAddresses();
      const chosen = vm.selectedAddressId;
      vm.delivery_address = 'دستی'; vm.plaque = '۱۲'; vm.onManualAddressInput();
      vm.onMapConfirm({ lat: 36, lng: 52 });
      await vm.refreshSavedAddresses();
      return { initial, chosen, manual: [vm.delivery_address, vm.plaque, vm.delivery_lat, vm.delivery_lng, vm.selectedAddressId] };
    });
    assert.deepEqual(result.initial, ['نشانی یک', 'منزل', 35.7, 51.4, '']);
    assert.equal(result.chosen, 'two');
    assert.deepEqual(result.manual, ['دستی', '۱۲', 36, 52, null]);
    const reset = await page.evaluate(async () => {
      const vm = document.querySelector('.laviz-storefront-shell').__vue__;
      const product = vm.products[0];
      vm.addProductCount(product.key, product.add_unit);
      await vm.$nextTick();
      vm.removeProduct(product.key);
      await vm.$nextTick();
      return [vm.selectedAddressId, vm.delivery_address];
    });
    assert.deepEqual(reset, ['one', 'نشانی یک']);
    console.log('PASS default and manual selection survive address refresh (intercepted addresses)');
    await page.goto('http://localhost:3333/profile?tab=addresses', { waitUntil: 'domcontentloaded' });
    await page.locator('.profile-section__edit-btn:visible').click();
    const control = page.getByRole('switch', { name: 'پیش‌فرض' });
    await page.locator('#address-form-modal.show').waitFor({ state: 'visible' });
    await page.waitForTimeout(400);
    await control.check({ force: true });
    assert.equal(await control.isChecked(), true);
    const dims = await page.locator('.address-default-switch').boundingBox();
    const close = await page.locator('.address-form-modal-header__close').boundingBox();
    assert.ok(dims.height >= 44 && close.width >= 44 && close.height >= 44);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await page.screenshot({ path: `.playwright-mcp/address-switch-${theme}-390.png`, animations: 'disabled' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    }
    console.log('PASS header switch toggles and 44px targets fit 390px in both themes');
    let writes = 0;
    page.on('request', req => { if (/\/profile\/addresses/.test(req.url()) && ['POST', 'PUT'].includes(req.method())) writes++; });
    await page.getByRole('button', { name: 'لغو', exact: true }).click();
    await page.waitForTimeout(300);
    assert.equal(writes, 0);
    await page.locator('.address-action-btn').first().click();
    await page.locator('#address-form-modal.show').waitFor({ state: 'visible' });
    await page.waitForTimeout(400);
    const edited = page.getByRole('switch', { name: 'پیش‌فرض' });
    const before = await edited.isChecked();
    await edited.click({ force: true });
    assert.equal(await edited.isChecked(), !before);
    await page.route('**/api/enduser/profile/addresses/**', route => route.fulfill({ json: { ok: true } }));
    const state = await page.evaluate(() => {
      function find(vm) { if (vm.$options.name === 'AddressForm') return vm; for (const child of vm.$children) { const found = find(child); if (found) return found; } }
      const vm = find(window.$nuxt);
      let payload;
      vm.$on('save', value => { payload = { ...value }; });
      vm.submit();
      return payload && payload.isDefault;
    });
    assert.equal(state, !before);
    console.log('PASS cancel sends no address write and edit emits selected isDefault');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
