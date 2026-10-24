const DELIVERY_DAY_LABELS = ['امروز', 'فردا', 'پس فردا'];

function visibleDeliveryOptions(days) {
  return Array.isArray(days) ? days.slice(0, DELIVERY_DAY_LABELS.length) : [];
}

function deliveryDayLabel(index) {
  return DELIVERY_DAY_LABELS[index] || 'روز تحویل';
}

module.exports = { visibleDeliveryOptions, deliveryDayLabel };
