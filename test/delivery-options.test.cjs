const assert = require('node:assert/strict');
const { visibleDeliveryOptions, deliveryDayLabel } = require('../utils/deliveryOptions');

const days = Array.from({ length: 7 }, (_, index) => ({ date: `2026/10/${7 + index}` }));

assert.deepEqual(visibleDeliveryOptions(days), days.slice(0, 3));
assert.deepEqual(visibleDeliveryOptions(null), []);
assert.equal(deliveryDayLabel(0), 'امروز');
assert.equal(deliveryDayLabel(1), 'فردا');
assert.equal(deliveryDayLabel(2), 'پس فردا');
assert.equal(deliveryDayLabel(3), 'روز تحویل');

console.log('delivery date window and labels passed.');
