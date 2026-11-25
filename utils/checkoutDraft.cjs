// Volatile private checkout draft, outside public Vuex state and persistence.
// Each app/request has a separate WeakMap key. The session credential is only
// compared in this closure, never returned or serialized into the basket.
const drafts = new WeakMap();
const FIELDS = [
  'delivery_type', 'delivery_date', 'delivery_time', 'check_one',
  'delivery_address', 'delivery_lat', 'delivery_lng', 'selectedAddressId',
  'addressOverridden', 'plaque', 'timeMode', 'orderComment',
];
function saveCheckoutDraft(app, owner, checkout) {
  const draft = {};
  for (const field of FIELDS) {
    const value = checkout[field];
    if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) draft[field] = value;
  }
  const code = checkout.discountCode || {};
  draft.discountCode = {
    code: code.code, code_valid_status: !!code.code_valid_status,
    discount_percent: code.discount_percent, max_amount: code.max_amount,
  };
  drafts.set(app, { owner: owner || null, draft });
}
function takeCheckoutDraft(app, owner) {
  const saved = drafts.get(app);
  drafts.delete(app);
  return saved && saved.owner === (owner || null) ? saved.draft : null;
}
function clearCheckoutDraft(app) { drafts.delete(app); }
module.exports = { saveCheckoutDraft, takeCheckoutDraft, clearCheckoutDraft };
