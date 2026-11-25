// Private, per-dialog customer state. Never put this object in Vuex or storage.
// BACKEND: §19. These are adapter operations, NOT production HTTP endpoints.
const digits = value => String(value == null ? '' : value).replace(/[۰-۹٠-٩]/g,
  char => String('۰۱۲۳۴۵۶۷۸۹'.includes(char) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(char) : '٠١٢٣٤٥٦٧٨٩'.indexOf(char)));
function phone(value) {
  const raw = digits(value).trim();
  if (/[^\d+\s()-]/.test(raw)) return '';
  let result = raw.replace(/[\s()-]/g, '');
  if (/^(\+98|0098)/.test(result)) result = '0' + result.replace(/^(\+98|0098)/, '');
  else if (/^9\d{9}$/.test(result)) result = '0' + result;
  return /^09\d{9}$/.test(result) ? result : '';
}
const validBill = bill => !!bill && typeof bill.quote_id === 'string' && bill.quote_id.length > 0 && bill.currency === 'IRT'
  && ['total_amount', 'discount_amount', 'shipping_cost', 'tax_amount', 'payment_amount'].every(key => Number.isSafeInteger(bill[key]) && bill[key] >= 0)
  && bill.shipping_cost === 0 && bill.discount_amount <= bill.total_amount
  && bill.payment_amount === bill.total_amount - bill.discount_amount + bill.tax_amount;
function gatewayUrl(value, local, origin) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    // Local fixture redirects are confined to the configured API origin/path.
    if (local) return url.origin === new URL(origin).origin && url.pathname.startsWith('/api/enduser/mock/restaurant/checkout/gateway/') ? url.href : null;
    return url.protocol === 'https:' ? url.href : null;
  } catch (_) { return null; }
}
const unavailable = () => Promise.reject(Object.assign(new Error('اتصال این خدمت هنوز آماده نیست. لطفاً با مسئول رستوران تماس بگیرید.'), { unavailable: true }));
function disconnectedAdapter() {
  // TODO BACKEND §19: merger supplies a scoped production adapter here. Reuse
  // existing OTP/discount/preview/create services only after their schema and
  // authorization are confirmed. Never guess URLs, log in the whole device,
  // expose an emergency OTP, infer paid from query parameters, or attest POS.
  return Object.fromEntries(['preview', 'challenge', 'verify', 'discounts', 'confirmCard', 'cancel', 'online', 'reconcile', 'revoke'].map(name => [name, unavailable]));
}
function createCheckout({ adapter = disconnectedAdapter(), items, now = Date.now, id = () => crypto.randomUUID(), redirect = () => {}, complete = () => {} }) {
  let cycle = id(), identity = 0, revision = 0, paymentGeneration = 0, alive = true;
  let challenge = null, challengeResult = null, pending = null;
  const state = {
    phase: 'checkout', fulfilment: 'dine_in', phone: '', phoneTouched: false,
    items: items.map(item => ({ ...item })), codeInput: '', discountCode: '', verified: false,
    codes: [], otp: '', otpError: '', resendAt: 0, bill: null, error: '',
    quoting: false, identifying: false, paying: false, cardOpenedAt: null,
    result: null, unresolved: false,
  };
  const payload = () => ({ cycle_id: cycle, customer_mobile: phone(state.phone) || null, fulfilment: state.fulfilment,
    products: state.items.filter(item => item.count > 0).map(item => ({ product_id: item.key, count: item.count })), discount_code: state.discountCode || null });
  const message = error => error && error.unavailable ? error.message : 'درخواست انجام نشد. اتصال را بررسی و دوباره تلاش کنید.';
  const current = (expected, version) => alive && cycle === expected && revision === version;
  async function preview(code = state.discountCode) {
    if (!alive) return false;
    const expected = cycle, version = ++revision;
    state.bill = null; state.quoting = true; state.error = '';
    const request = { ...payload(), discount_code: code || null };
    try {
      if (!request.products.length) return false;
      const result = await adapter.preview(request);
      if (!current(expected, version)) return false;
      if (!validBill(result)) throw Error('Invalid quote');
      state.bill = result; state.discountCode = code || ''; return true;
    } catch (error) { if (current(expected, version)) state.error = message(error); return false; }
    finally { if (current(expected, version)) state.quoting = false; }
  }
  function setPhone(value) {
    if (pending || state.paying) return;
    const before = phone(state.phone), after = phone(value);
    state.phone = value;
    if (before === after && after) return;
    const old = cycle; cycle = id(); identity++; revision++;
    challenge = null; challengeResult = null; state.verified = false; state.codes = []; state.otp = ''; state.otpError = '';
    state.discountCode = ''; state.codeInput = ''; state.resendAt = 0; state.identifying = false; state.bill = null;
    // Tombstone the old cycle, even if its delayed verify has not arrived yet.
    Promise.resolve(adapter.revoke({ cycle_id: old })).catch(() => {});
  }
  function prefillOtp() {
    // BACKEND §19: explicit local adapter capability only. No generic response
    // field or production default code is consumed by the reusable checkout.
    if (!state.otp && challengeResult && adapter.localOnly === true && typeof adapter.otpPrefill === 'function') {
      const value = adapter.otpPrefill(challengeResult);
      if (/^\d{4,8}$/.test(value)) state.otp = value;
    }
  }
  async function viewDiscounts() {
    state.phoneTouched = true;
    if (!alive || !phone(state.phone) || state.identifying) return false;
    if (state.verified) return true;
    state.phase = 'otp'; state.otpError = ''; state.otp = '';
    if (now() < state.resendAt && challenge) { prefillOtp(); return true; }
    const expected = cycle, sequence = ++identity;
    state.identifying = true;
    try {
      const result = await adapter.challenge({ cycle_id: cycle, mobile: phone(state.phone) });
      if (!alive || expected !== cycle || sequence !== identity) return false;
      if (!result || !result.challenge_id || !Number.isFinite(result.retry_after) || result.retry_after < 0) throw Error('Invalid challenge');
      challenge = result.challenge_id; challengeResult = result;
      state.resendAt = now() + result.retry_after * 1000; prefillOtp(); return true;
    } catch (error) { if (alive && expected === cycle && sequence === identity) state.otpError = message(error); return false; }
    finally { if (alive && expected === cycle && sequence === identity) state.identifying = false; }
  }
  async function verify() {
    if (!alive || state.phase !== 'otp') return false;
    if (state.identifying || (!state.verified && (!challenge || !/^\d{4,8}$/.test(digits(state.otp))))) { state.otpError = 'کد تأیید را کامل وارد کنید.'; return false; }
    const expected = cycle, sequence = ++identity;
    state.identifying = true; state.otpError = '';
    try {
      if (!state.verified) {
        const result = await adapter.verify({ cycle_id: cycle, challenge_id: challenge, code: digits(state.otp) });
        if (!alive || expected !== cycle || sequence !== identity) return false;
        if (!result || result.verified !== true) throw Error('Not verified');
        state.verified = true;
      }
      const codes = await adapter.discounts({ cycle_id: cycle });
      if (!alive || expected !== cycle || sequence !== identity) return false;
      if (!Array.isArray(codes)) throw Error('Invalid discounts');
      state.codes = codes; state.verified = true; state.otp = ''; challenge = null; challengeResult = null; state.phase = 'checkout';
      return true;
    } catch (_) { if (alive && expected === cycle && sequence === identity) state.otpError = 'کد تأیید معتبر نیست یا دریافت تخفیف‌ها ممکن نشد. دوباره تلاش کنید.'; return false; }
    finally { if (alive && expected === cycle && sequence === identity) state.identifying = false; }
  }
  function ready() {
    state.phoneTouched = true;
    return !!phone(state.phone) && state.items.some(item => item.count > 0) && validBill(state.bill) && !state.quoting && !state.paying && !state.unresolved;
  }
  function openCard() {
    if (!ready()) return false;
    state.phase = 'card'; state.cardOpenedAt = now(); state.error = ''; return true;
  }
  const cardActionsVisible = () => state.phase === 'card' && state.cardOpenedAt !== null && now() - state.cardOpenedAt >= 30000;
  function accept(result, action) {
    if (!result || !['confirmation_requested', 'cancelled', 'pending_online'].includes(result.state) || result.attempt_id !== pending.key || result.payment_amount !== pending.amount) throw Error('Unexpected attempt result');
    if (action === 'online') {
      if (result.state !== 'pending_online') throw Error('Unexpected payment state');
      const url = gatewayUrl(result.payment_link, adapter.localOnly === true, adapter.origin);
      if (!url) throw Error('Unsafe gateway');
      state.phase = 'online'; state.unresolved = false; redirect(url); return;
    }
    if (result.state !== (action === 'confirmCard' ? 'confirmation_requested' : 'cancelled')) throw Error('Unexpected terminal state');
    if (action === 'confirmCard' && (!result.order_ref || result.customer_bound !== true)) throw Error('Missing customer ownership');
    state.result = result; state.phase = 'result'; state.unresolved = false;
    state.phone = ''; state.codes = []; state.verified = false; state.discountCode = ''; state.codeInput = ''; state.otp = ''; state.bill = null;
    identity++; revision++; complete(result);
    Promise.resolve(adapter.revoke({ cycle_id: cycle })).catch(() => {});
  }
  async function transact(action) {
    if (state.paying || !alive) return false;
    if (pending && pending.action !== action) return false;
    if (!pending) {
      if (action !== 'online' && !cardActionsVisible()) return false;
      if (!ready()) return false;
      // BACKEND §19: the key binds phone/customer-cycle, fulfilment, lines,
      // code, quote and action. Retry preserves this frozen request verbatim.
      pending = { key: id(), action, amount: state.bill.payment_amount, body: { ...payload(), quote_id: state.bill.quote_id } };
    }
    const generation = ++paymentGeneration;
    state.paying = true; state.error = '';
    try {
      const result = await adapter[action]({ ...pending.body, attempt_id: pending.key });
      if (!alive || generation !== paymentGeneration) return false;
      accept(result, action); if (action !== 'online') pending = null; return true;
    } catch (error) {
      if (alive && generation === paymentGeneration) {
        if (error && error.unavailable) { pending = null; state.unresolved = false; state.error = message(error); }
        else { state.unresolved = true; state.error = 'نتیجه درخواست مشخص نیست. برای بررسی دوباره تلاش کنید.'; }
      }
      return false;
    } finally { if (alive && generation === paymentGeneration) state.paying = false; }
  }
  async function retry() {
    if (!pending || state.paying) return false;
    return transact(pending.action);
  }
  function edit() {
    state.phase = 'checkout'; state.cardOpenedAt = null;
    // No order exists merely because the POS dialog opened. An uncertain
    // submitted action retains its key; editing never submits a second order.
  }
  function destroy() {
    alive = false; identity++; revision++; paymentGeneration++;
    challenge = null; challengeResult = null;
    Promise.resolve(adapter.revoke({ cycle_id: cycle })).catch(() => {});
    state.phone = ''; state.otp = ''; state.codes = []; state.verified = false; state.discountCode = ''; state.codeInput = '';
  }
  return { state, preview, setPhone, viewDiscounts, verify, openCard, cardActionsVisible, edit, retry,
    confirmCard: () => transact('confirmCard'), cancel: () => transact('cancel'), online: () => transact('online'),
    setFulfilment(value) { if (!pending && !state.paying && ['takeaway', 'dine_in'].includes(value)) { state.fulfilment = value; return preview(); } },
    applyCode(code) { if (pending || state.paying) return false; state.codeInput = String(code || '').trim(); return preview(state.codeInput); },
    closeOtp() {
      // The modal's hide event also runs after a successful verify. Only an
      // actual dismissal invalidates this generation; it must not erase success.
      if (state.phase !== 'otp') return;
      const inFlight = state.identifying;
      identity++; state.identifying = false; state.phase = 'checkout'; state.otp = ''; state.otpError = '';
      if (inFlight) {
        // A submitted OTP may already be consumed server-side. Retire that
        // authorization cycle so reopening can challenge safely without letting
        // its late verify/discount response populate this checkout. Draft stays.
        const old = cycle; cycle = id(); challenge = null; challengeResult = null; state.resendAt = 0;
        state.verified = false; state.codes = [];
        Promise.resolve(adapter.revoke({ cycle_id: old })).catch(() => {});
        preview();
      }
    }, ready, destroy };
}
module.exports = { digits, phone, validBill, gatewayUrl, disconnectedAdapter, createCheckout };
