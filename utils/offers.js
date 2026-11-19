// Discount codes as the cards and the details sheet show them. Shared by
// pages/index/components/discountSection.vue (the cards) and pages/index.vue (which
// shows a freshly issued code by itself, once).

export const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

// The API names the percentage differently across endpoints; accept the usual
// spellings and ignore anything that is not a sensible 1-100.
export function percentOf(o) {
  const v = Number(o && (o.percent ?? o.discount_percent ?? o.percentage));
  return v > 0 && v <= 100 ? v : 0;
}

// "تا سقف ۶۰٬۰۰۰ تومان": only for a percentage code that has a cap.
// FOR THE BACKEND: `maxAmount` (toman, number) on each code of
// /profile/active-discount-codes; absent, null or 0 means no cap.
export function capText(o) {
  const cap = Number(o && (o.maxAmount ?? o.max_amount));
  return percentOf(o) && cap > 0 ? `تا سقف ${fa(cap)} تومان` : '';
}

export function remainingText(c) {
  if (c.remainingDays === null || c.remainingDays === undefined) return 'بدون محدودیت زمانی';
  if (c.remainingDays === 0) return 'امروز آخرین مهلت';
  if (c.remainingDays === 1) return 'یک روز مانده';
  return `${fa(c.remainingDays)} روز مانده`;
}

/**
 * A code issued to this customer, from /profile/active-discount-codes.
 *
 * FOR THE BACKEND: every code should carry a `description` (string). It is
 * written per code AND per customer, because the terms can differ from one
 * customer to the next, and the app shows it as-is in the code's details sheet.
 * Example: "فقط یک‌بار تا پایان ماه امکان استفاده از این کد تخفیف را دارید."
 * Until the API sends it, the sheet falls back to a generic line.
 */
export function personalOffer(c) {
  const percent = percentOf(c);
  return {
    id: 'p-' + c.id,
    personal: true,
    pill: percent ? `${fa(percent)}٪ تخفیف` : `تا ${fa(c.amount)} تومان`,
    title: c.title || 'کد تخفیف شما',
    hint: remainingText(c),
    headline: percent ? `${fa(percent)}٪ تخفیف` : `تا ${fa(c.amount)} تومان تخفیف`,
    sub: remainingText(c),
    cap: capText(c),
    scope: (c.description || '').trim() || 'این کد فقط برای شما صادر شده است',
    code: c.code,
  };
}

// A shop-wide campaign anyone can use.
export function publicOffer(o) {
  const percent = percentOf(o);
  return {
    id: 'g-' + (o.id || o.code),
    personal: false,
    pill: percent ? `${fa(percent)}٪ تخفیف` : (o.headline || 'تخفیف ویژه'),
    title: o.title || 'تخفیف ویژه',
    hint: o.hint || 'روی سبد خرید اعمال می‌شود',
    headline: o.headline || o.title,
    sub: o.sub || '',
    cap: capText(o),
    scope: 'ویژه این سفارش',
    code: o.code || '',
  };
}

// ---- "show a new code once" ---------------------------------------------------
//
// FOR THE BACKEND: each code of /profile/active-discount-codes should carry
// `seenDate` (ISO date, or null while the customer has not been shown the code
// yet). The app tells the server when it has shown a code:
//   PUT /api/enduser/profile/active-discount-codes/{id}/seen
// A server that sends no `seenDate` at all is also fine: then this device
// remembers which codes it has shown (localStorage), so a code shows once per
// device instead of once per customer.
const SEEN_KEY = 'laviz:seen-discount-codes';

export function readSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]').map(String));
  } catch (e) {
    return new Set();
  }
}

export function rememberSeenId(id) {
  try {
    const seen = readSeenIds();
    seen.add(String(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch (e) { /* storage blocked: the code may show again next time */ }
}

// A code the customer has not been shown yet.
export function isUnseen(code, seenIds) {
  if (seenIds.has(String(code.id))) return false;
  if (code.seenDate !== undefined) return !code.seenDate;
  return true;
}
