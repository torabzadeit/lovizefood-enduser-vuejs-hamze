// Focused followup against the existing local mock; no API interception/restart.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3333';
const output = path.resolve(__dirname, '../.playwright-mcp/refund-card-followup');
const card = '6219861034529007'; // Public fixture only.

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 'mock-user', first_name: 'کاربر', last_name: 'نمونه' }));
      localStorage.setItem('pwaCallOut', '1');
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let puts = 0, gets = 0;
    page.on('request', request => {
      if (!/\/api\/enduser\/profile$/.test(request.url())) return;
      if (request.method() === 'PUT') puts++;
      if (request.method() === 'GET') gets++;
    });
    await page.goto(origin + '/profile?tab=bank-card', { waitUntil: 'domcontentloaded' });
    const input = page.locator('#refund-bank-card');
    const feedback = page.locator('#bank-card-feedback');
    const form = page.locator('.bank-card-form');
    const save = page.getByRole('button', { name: 'ذخیره شماره کارت', exact: true });
    const logout = page.getByRole('button', { name: 'خروج از حساب', exact: true });
    await page.waitForFunction(() => document.activeElement?.id === 'refund-bank-card');
    const api = new URL(await page.evaluate(() => window.$nuxt.$axios.defaults.baseURL));
    assert.ok(['localhost', '127.0.0.1'].includes(api.hostname) && api.port === '3003', 'Only local mock may receive fixtures');
    assert.equal(await page.getByRole('link', { name: 'بازگشت به سفارش', exact: true }).count(), 0);
    assert.equal(await page.locator('.profile-body .profile-logout').count(), 0);

    // Every typed Persian digit gets evaluated; partial lengths remain quiet.
    await input.fill('');
    for (const digit of '۶۲۱۹۸۶۱۰۳۴۵۲۹۰۰') {
      await input.pressSequentially(digit);
      assert.equal(await feedback.innerText(), '');
      assert.equal(await input.getAttribute('aria-invalid'), 'false');
      assert.equal(puts, 0);
    }
    await input.pressSequentially('۷');
    assert.equal(await feedback.innerText(), 'ساختار شماره کارت صحیح است.');
    assert.equal(await feedback.getAttribute('role'), 'status');
    assert.equal(await form.getByText('شماره کارت ذخیره شد.', { exact: true }).count(), 0);
    await input.fill('٦٢١٩-٨٦١٠ ٣٤٥٢ ٩٠٠٧');
    assert.equal(await feedback.innerText(), 'ساختار شماره کارت صحیح است.');
    await input.fill('6219861034529008');
    assert.match(await feedback.innerText(), /رقم کنترل/);
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    await save.click();
    assert.match(await feedback.innerText(), /رقم کنترل/);
    assert.doesNotMatch(await feedback.innerText(), /۱۶/);
    await input.fill('0000 0000 0000 0000');
    assert.match(await feedback.innerText(), /تکراری/);
    await input.fill('۶۲۱۹x');
    assert.match(await feedback.innerText(), /فقط باید شامل رقم/);
    await input.fill('۶۲۱۹');
    assert.equal(await feedback.innerText(), '');
    await save.click();
    assert.match(await feedback.innerText(), /دقیقاً ۱۶ رقم/);
    await input.pressSequentially('۸');
    assert.equal(await feedback.innerText(), '', 'Typing again must suppress prior length feedback');
    await input.fill(card + '0');
    assert.equal(await feedback.innerText(), '', 'Overlength feedback waits for explicit Save too');
    await save.click();
    assert.match(await feedback.innerText(), /دقیقاً ۱۶ رقم/);
    await input.fill('');
    assert.equal(await feedback.innerText(), '');
    await save.click();
    assert.match(await feedback.innerText(), /دقیقاً ۱۶ رقم/);
    await input.fill(card);
    assert.equal(await feedback.innerText(), 'ساختار شماره کارت صحیح است.');
    assert.equal(puts, 0, 'Input and rejected submits must never PUT');
    console.log('PASS every input derives validation; length waits for Save and resets on editing; checksum/repeated/characters are distinct; zero PUTs');

    for (const width of [390, 515]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
        const geometry = await page.evaluate(() => {
          const header = document.querySelector('.profile-header').getBoundingClientRect();
          const button = document.querySelector('.profile-header__logout').getBoundingClientRect();
          const back = document.querySelector('.profile-header__back').getBoundingClientRect();
          return { left: button.left, right: button.right, width: button.width, height: button.height,
            mid: header.left + header.width / 2, backLeft: back.left, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.ok(geometry.right < geometry.mid && geometry.left < geometry.backLeft, 'Logout must be physically left');
        assert.ok(geometry.width >= 44 && geometry.height >= 44, 'Touch target below 44px');
        assert.equal(geometry.overflow, false);
        assert.equal(await logout.getAttribute('title'), 'خروج از حساب');
        assert.equal(await page.getByRole('button', { name: 'خروج از حساب', exact: true }).count(), 1);
        await page.screenshot({ path: path.join(output, `profile-live-valid-${theme}-${width}.png`) });
      }
    }
    console.log('PASS physical-left header icon, 44px target, accessible name/title, bottom removed, 390/515 light/dark without overflow');

    // One actual happy save, preserving existing readback semantics.
    const getsBefore = gets;
    await save.click();
    await form.getByText('شماره کارت ذخیره شد.', { exact: true }).waitFor();
    assert.equal(puts, 1);
    assert.equal(gets - getsBefore, 2, 'Save must still GET fresh profile and GET readback');
    assert.equal(await input.inputValue(), '');
    assert.equal(await input.getAttribute('aria-invalid'), 'false');
    assert.equal(await page.evaluate(value => [JSON.stringify(localStorage), JSON.stringify(sessionStorage), location.href].some(text => text.includes(value)), card), false);
    console.log('PASS one explicit actual API save + two GETs, confirmed result, no PAN in storage/URL');

    await logout.click();
    const dialog = page.locator('.modal.show');
    await dialog.getByText('آیا برای خروج از حساب اطمینان دارید؟', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'انصراف', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), 'mock-token');
    assert.equal(await form.isVisible(), true);
    assert.equal(await form.locator('bdi').count(), 1);
    await logout.click();
    await dialog.getByRole('button', { name: 'بله، خروج', exact: true }).click();
    await page.waitForURL(origin + '/');
    assert.deepEqual(await page.evaluate(() => ({ token: localStorage.getItem('token'), user: localStorage.getItem('user'),
      authorization: window.$nuxt.$axios.defaults.headers.common.Authorization || null })), { token: null, user: null, authorization: null });
    assert.equal(await page.locator('#refund-bank-card, .bank-card-form__saved').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS unchanged logout confirmation: Cancel preserves session, Confirm clears credentials/header and unmounts card data');
    await context.close();
    console.log('REFUND CARD FOLLOWUP PASSED');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
