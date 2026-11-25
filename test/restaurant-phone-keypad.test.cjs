const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../components/immersive-menu/RestaurantCheckout.vue'), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*;\s*$/gm, '').replace('export default', 'module.exports =');
const sandbox = { module: { exports: {} }, DiscountSection: {}, phone: () => false };
vm.runInNewContext(script, sandbox);
const methods = sandbox.module.exports.methods;
function fixture(initial = '') {
  const ctx = { state: { phone: initial }, calls: [], focused: 0,
    setPhone(value) { this.calls.push(value); this.state.phone = value; },
    $nextTick(fn) { fn.call(this); }, focusPhone() { this.focused++; } };
  Object.assign(ctx, { phoneDigit: methods.phoneDigit, phoneDelete: methods.phoneDelete });
  return ctx;
}
test('digit input retains leading zero, caps at 11 and deletion removes the final digit', () => {
  const ctx = fixture();
  for (const digit of '091234567890') methods.phoneDigit.call(ctx, digit);
  assert.equal(ctx.state.phone, '09123456789');
  assert.equal(ctx.calls.length, 11);
  methods.phoneDelete.call(ctx); assert.equal(ctx.state.phone, '0912345678');
  methods.phoneDigit.call(ctx, '9'); assert.equal(ctx.state.phone, '09123456789');
  assert.equal(ctx.focused, 14);
});
test('physical keyboard digits and backspace use the same path', () => {
  const ctx = fixture('0'); let prevented = 0;
  for (const key of ['9', 'Backspace']) methods.phoneKeydown.call(ctx, { key, preventDefault() { prevented++; } });
  assert.equal(ctx.state.phone, '0'); assert.equal(prevented, 2);
});
test('international prefixes retain their full digit capacity', () => {
  for (const value of ['+989123456789', '00989123456789']) {
    const ctx = fixture();
    for (const digit of value) {
      if (digit === '+') methods.phoneKeydown.call(ctx, { key: digit, preventDefault() {} });
      else methods.phoneDigit.call(ctx, digit);
    }
    assert.equal(ctx.state.phone, value);
  }
});
test('phone is readonly with inputmode none and modal focuses it on shown', () => {
  assert.match(source, /id="restaurant-phone"[^>]*inputmode="none"[^>]*readonly/);
  assert.match(source, /@shown="focusPhone"/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
});
test('keypad uses six equal columns on narrow screens, eleven on wide screens and 55px keys', () => {
  assert.match(source, /\.rc-phone-pad\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(source, /@media\s*\(min-width:\s*700px\)\s*\{\s*\.rc-phone-pad\s*\{[^}]*repeat\(11,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(source, /\.rc-phone-pad button\s*\{[^}]*height:\s*55px/s);
  assert.doesNotMatch(source, /\.rc-phone-pad\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
});
test('digit backgrounds darken in order and retain readable text contrast', () => {
  const shades = [...source.matchAll(/\.rc-phone-pad button:nth-child\((\d+)\) \{ background: #([0-9a-f]{6}); color: #([0-9a-f]{6}); \}/g)];
  assert.equal(shades.length, 11);
  const luminance = hex => {
    const rgb = hex.match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  for (let i = 0; i < shades.length; i++) {
    assert.equal(Number(shades[i][1]), i + 1);
    const bg = luminance(shades[i][2]); const fg = luminance(shades[i][3]);
    assert.ok((bg + 0.05) / (fg + 0.05) >= 4.5);
    if (i > 0 && i < 10) assert.ok(bg < luminance(shades[i - 1][2]));
  }
  assert.notEqual(shades[10][2], shades[9][2]);
});
test('footer uses current bill amount only when not quoting', () => {
  assert.match(source, /rc-footer-total[^\n]*state\.quoting \? 'در حال به‌روزرسانی…' : billAmount\('payment_amount'\)/);
  assert.equal(methods.billAmount.call({ state: { bill: null } }, 'payment_amount'), '…');
  assert.equal(methods.billAmount.call({ state: { bill: { payment_amount: 123 } }, number: n => String(n) }, 'payment_amount'), '123 تومان');
});
