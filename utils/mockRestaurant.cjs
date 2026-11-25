const loopback = url => ['http:', 'https:'].includes(url.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

function localMockAllowed(dev, pageOrigin, apiBase) {
  try { return dev === true && loopback(new URL(pageOrigin)) && loopback(new URL(apiBase)); } catch (_) { return false; }
}

// BACKEND: §18 mock proof only. Persisted user flags are never authorization.
function verifiedMockScope(data) {
  return !!data && data.mockOnly === true && data.scope === 'restaurant:mock';
}

// BACKEND: §18 preview/create must remain dine-in, unpaid and without personal discounts.
function verifiedMockBill(data) {
  const fields = ['total_amount', 'discount_amount', 'shipping_cost', 'tax_amount', 'payment_amount'];
  return !!data && data.mockOnly === true && fields.every(key => typeof data[key] === 'number' && Number.isFinite(data[key]) && data[key] >= 0)
    && data.shipping_cost === 0 && data.discount_amount === 0
    && data.payment_amount === data.total_amount + data.tax_amount;
}

module.exports = { localMockAllowed, verifiedMockScope, verifiedMockBill };
