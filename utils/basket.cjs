// Pure basket transitions. Create one state per app/request; replace it after a
// transition. No storage, addresses, account identity, API calls or Vue singleton.
const FIELDS = [
  'name', 'categoryId', 'categoryTitle', 'description', 'thumbnail', 'image',
  'unit_name', 'menu_type', 'isSpecial', 'servableToday', 'specialDaysText',
  'ratingAverage', 'ratingCount',
];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const keyOf = value => typeof value === 'string' ? value.trim()
  : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
const quantity = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const issue = (key, reason) => ({ key, reason });

// Decimal units (0.1, 0.25, etc.) must return to exactly zero after removal.
// Scale quantity operations only; monetary arithmetic below remains unchanged.
function addQuantity(current, unit, steps) {
  const decimals = value => {
    const [digits, exponent = '0'] = String(value).split('e');
    return Math.max(0, (digits.split('.')[1] || '').length - Number(exponent));
  };
  const scale = 10 ** Math.max(decimals(current), decimals(unit));
  const left = Math.round(current * scale);
  const right = Math.round(unit * scale);
  const next = left + right * steps;
  return Number.isSafeInteger(left) && Number.isSafeInteger(right) && Number.isSafeInteger(next)
    ? next / scale : current + unit * steps;
}

function createBasket(products = []) {
  return reconcileCatalog({ products: [], counts: Object.create(null), issues: [] }, products);
}

function reconcileCatalog(basket, products) {
  const counts = Object.create(null);
  const catalog = [];
  const issues = [];
  for (const raw of Array.isArray(products) ? products : []) {
    const key = keyOf(raw && raw.key);
    if (!key || own(counts, key)) {
      issues.push(issue(key, key ? 'duplicate-key' : 'invalid-key'));
      continue;
    }
    if (raw.price == null || !Number.isFinite(Number(raw.price)) || Number(raw.price) < 0) {
      issues.push(issue(key, 'invalid-price'));
      continue;
    }
    const product = { key };
    for (const field of FIELDS) {
      if (own(raw, field) && (raw[field] == null || ['string', 'number', 'boolean'].includes(typeof raw[field]))) {
        product[field] = raw[field];
      }
    }
    product.price = Number(raw.price);
    product.add_unit = Number.isFinite(Number(raw.add_unit)) ? Number(raw.add_unit) : 0;
    product.discount_percent = Number(raw.discount_percent) || 0;
    product.isOutOfStock = !!raw.isOutOfStock;
    product.specialDay = Array.isArray(raw.specialDay)
      ? raw.specialDay.filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
      : typeof raw.specialDay === 'string' ? raw.specialDay : '';
    const previous = own(basket.counts, key) ? basket.counts[key] : 0;
    counts[key] = quantity(previous) ? previous : 0;
    if (product.isOutOfStock && counts[key] > 0) {
      counts[key] = 0;
      issues.push(issue(key, 'out-of-stock'));
    }
    const old = basket.products.find(item => item.key === key);
    if (counts[key] > 0 && old && old.add_unit !== product.add_unit) {
      issues.push(issue(key, 'unit-changed'));
    }
    catalog.push(product);
  }
  for (const old of basket.products) {
    if (!own(counts, old.key) && basket.counts[old.key] > 0) issues.push(issue(old.key, 'removed'));
  }
  return { products: catalog, counts, issues };
}

function allowedOnDay(product, dayIndex) {
  if (dayIndex == null || product.menu_type !== 'specialDay' || !product.isSpecial) return true;
  let days = product.specialDay;
  if (typeof days === 'string') {
    try { days = JSON.parse(days); } catch (_) { return false; }
  }
  return Array.isArray(days) && days.includes(dayIndex);
}

// Used by the existing removeProduct action with count=0, as well as steppers.
function setCount(basket, value, count, options = {}) {
  const key = keyOf(value);
  const product = basket.products.find(item => item.key === key);
  let reason;
  if (!product) reason = 'missing-product';
  else if (!quantity(count)) reason = 'invalid-count';
  else if (count > 0 && (!quantity(product.add_unit) || product.add_unit <= 0)) reason = 'invalid-unit';
  else if (count > 0 && product.isOutOfStock) reason = 'out-of-stock';
  else if (count > (basket.counts[key] || 0) && !allowedOnDay(product, options.dayIndex)) reason = 'special-day';
  if (reason) return { ...basket, issues: [issue(key, reason)] };
  const counts = Object.assign(Object.create(null), basket.counts, { [key]: count });
  return { products: basket.products, counts, issues: [] };
}

function changeCount(basket, value, direction, options) {
  const key = keyOf(value);
  const product = basket.products.find(item => item.key === key);
  if (!product) return { ...basket, issues: [issue(key, 'missing-product')] };
  const steps = options.steps == null ? 1 : options.steps;
  if (!Number.isSafeInteger(steps) || steps <= 0 || !Number.isFinite(product.add_unit) || product.add_unit <= 0) {
    return { ...basket, issues: [issue(key, 'invalid-unit')] };
  }
  // Clamp the legacy underflow (e.g. reordered 0.5 with today's unit=1).
  const count = Math.max(0, addQuantity(basket.counts[key] || 0, product.add_unit, direction * steps));
  return setCount(basket, key, count, options);
}

function increment(basket, key, options = {}) {
  return changeCount(basket, key, 1, options);
}

function decrement(basket, key, options = {}) {
  return changeCount(basket, key, -1, options);
}

// Pass takeReorder().lines, not the order/address/account object. Replacement is
// idempotent; null means no pending handoff and must not clear an existing basket.
function replaceFromReorder(basket, lines, options = {}) {
  if (!Array.isArray(lines)) return basket;
  let next = createBasket(basket.products);
  const issues = [];
  for (const line of lines) {
    if (!line || !quantity(line.count) || line.count === 0) continue;
    const key = keyOf(line.productId);
    const product = next.products.find(item => item.key === key)
      || next.products.find(item => String(item.name).trim() === String(line.title || '').trim());
    if (!product) {
      issues.push(issue(key, 'missing-product'));
      continue;
    }
    next = setCount(next, product.key, addQuantity(next.counts[product.key], line.count, 1), options);
    issues.push(...next.issues);
  }
  return { ...next, issues };
}

function selectedProducts(basket) {
  return basket.products.filter(product => basket.counts[product.key] > 0 && !product.isOutOfStock)
    .map(product => ({
      key: product.key, name: product.name, count: basket.counts[product.key],
      price: product.price, unit_name: product.unit_name, discount_percent: product.discount_percent,
      total: basket.counts[product.key] * product.price,
      totalWithDiscount: basket.counts[product.key] * product.price * (1 - product.discount_percent / 100),
    }));
}

function orderProducts(basket) {
  return selectedProducts(basket).map(line => ({ product_id: line.key, count: line.count }));
}

// Characterized from index.vue calcBill: RAW line prices, delivery, rounded tax,
// then the percentage code and cap. Product-card discounts are display-only in
// this legacy calculation. Do not silently change that financial discrepancy.
// Options are transient calculation inputs; never store discount/account data.
function calculateBill(basket, options = {}) {
  const discount = options.discountCode || {};
  const total = selectedProducts(basket).reduce((sum, line) => sum + line.total, 0);
  const shipping = options.delivery_type === 'sendToMe' && total > 0 ? Number(options.shippingCost || 0) : 0;
  const beforeTax = total + shipping;
  const tax = options.taxEnabled && options.taxPercent > 0 ? Math.round(beforeTax * options.taxPercent / 100) : 0;
  const subtotal = beforeTax + tax;
  let amount = discount.code_valid_status ? Math.round(subtotal / 100 * discount.discount_percent) : 0;
  const cap = Number(discount.max_amount) || 0;
  if (discount.code_valid_status && cap > 0) amount = Math.min(amount, cap);
  return {
    total_amount: total, discount_amount: amount, tax_amount: tax,
    shipping_amount: shipping, payment_amount: Math.max(0, subtotal - amount),
  };
}

module.exports = {
  createBasket, reconcileCatalog, setCount, increment, decrement,
  replaceFromReorder, selectedProducts, orderProducts, calculateBill,
};
