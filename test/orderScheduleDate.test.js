const assert = require('assert');
const { isOrderScheduledForTodayOrLater } = require('../utils/orderScheduleDate');

const now = new Date('2026-09-27T21:00:00.000Z'); // 2026-09-28 00:30 in Tehran

assert.strictEqual(
  isOrderScheduledForTodayOrLater({ deliveryDate: '2026-02-28', createDate: '2026-09-27' }, now),
  false,
  'an old delivery date must stay hidden even when the order was created recently',
);
assert.strictEqual(
  isOrderScheduledForTodayOrLater({ deliveryDate: '2026-09-28' }, now),
  true,
  'an order scheduled for today in Tehran must remain visible',
);
assert.strictEqual(
  isOrderScheduledForTodayOrLater({ deliveryDate: '2026-09-29' }, now),
  true,
  'an order scheduled for a future day must remain visible',
);
assert.strictEqual(
  isOrderScheduledForTodayOrLater({ deliveryDate: '2026-09-27' }, now),
  false,
  'an order scheduled for yesterday in Tehran must be hidden',
);
assert.strictEqual(
  isOrderScheduledForTodayOrLater({ deliveryDate: 'invalid' }, now),
  false,
  'an invalid schedule must fail closed',
);

process.stdout.write('orderScheduleDate: 5 cases passed\n');
