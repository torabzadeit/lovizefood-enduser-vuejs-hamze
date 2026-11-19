// "Order again": the order history (pages/profile.vue) hands an old order to the
// first page (pages/index.vue), which builds the same basket from it and opens it.
// The hand-over goes through sessionStorage, because the two are different pages.
//
// FOR THE BACKEND: each line of an order (GET /profile/orders) should carry
// `productId`, the same id the menu uses for the product (`key` in
// /core/initialize), next to `productTitle` and `count`. The app matches lines to
// today's menu by that id; without it, it falls back to matching the product's
// name. A food that is no longer on the menu, or is out of stock today, is left out
// and the customer is told which.
const KEY = 'laviz:reorder';

// Remembers what the basket should be built from. Returns false when the browser
// refuses to store it.
export function stashReorder(order) {
  const lines = (order.items || order.orderItems || [])
    .map((line) => ({
      productId: String(line.productId || line.product_id || ''),
      title: String(line.productTitle || line.title || line.name || '').trim(),
      count: Number(line.count) || 0,
    }))
    .filter((line) => line.count > 0);
  if (!lines.length) return false;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      lines,
      deliveryType: order.deliveryType || '',
      deliveryAddress: order.deliveryAddress || '',
    }));
    return true;
  } catch (e) {
    return false;
  }
}

// Reads and clears it, so a reload does not rebuild the basket again.
export function takeReorder() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const data = JSON.parse(raw);
    return data && Array.isArray(data.lines) && data.lines.length ? data : null;
  } catch (e) {
    return null;
  }
}
