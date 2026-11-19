// "I understood": an order the restaurant did not accept stays on the first page as
// an orange card until the customer taps «متوجه شدم». After that it only lives in
// the order history of the profile. Used by pages/index.vue (the card) and
// pages/profile.vue (which keeps the order out of the history until then).
//
// FOR THE BACKEND: an order the restaurant rejected (status 11) should
//  - carry `rejectReason` (string): the restaurant's own words on why, shown on the
//    card as it is;
//  - stay in GET /profile/orders/current until the customer acknowledges it;
//  - carry `acknowledgedDate` (ISO date, or null) in GET /profile/orders;
//  - be acknowledged with PUT /api/enduser/profile/orders/{id}/acknowledge, which the
//    app calls when the customer taps «متوجه شدم». After that the order is no longer
//    "current" and its `acknowledgedDate` is set.
// A server that sends no `acknowledgedDate` at all is also fine: this device then
// remembers which orders were acknowledged (localStorage).
const KEY = 'laviz:acknowledged-orders';

export function readAckedOrderIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]').map(String));
  } catch (e) {
    return new Set();
  }
}

export function rememberAckedOrderId(id) {
  try {
    const ids = readAckedOrderIds();
    ids.add(String(id));
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch (e) { /* storage blocked: the card may show again next time */ }
}

// The customer has already tapped «متوجه شدم» for this order.
export function isAcknowledged(order, ackedIds = readAckedOrderIds()) {
  if (!order) return false;
  return !!order.acknowledgedDate || ackedIds.has(String(order.id));
}
