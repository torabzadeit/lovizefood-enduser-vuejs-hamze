// Ordering rules for the "غذای روز سرآشپز" tab.
//
// Week indices follow the Persian week used across the app: 0=شنبه … 6=جمعه.
// The list always starts at today and wraps around, so on دوشنبه the order is
// دوشنبه، سه‌شنبه، چهارشنبه … یکشنبه. Future days support preorder.

export const WEEK_DAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
];

const TEHRAN_WEEKDAY_TO_INDEX = {
  Sat: 0,
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
};

export function todayWeekIndex(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    weekday: 'short',
  }).format(date);
  const index = TEHRAN_WEEKDAY_TO_INDEX[weekday];
  return index === undefined ? 0 : index;
}

// `specialDay` is stored as a JSON array of week indices. Bad data must not
// take the menu down, so anything unparsable is treated as "no days".
export function parseSpecialDays(specialDay) {
  if (Array.isArray(specialDay)) return specialDay.filter((d) => Number.isInteger(d));
  if (typeof specialDay !== 'string' || !specialDay.trim()) return [];
  try {
    const parsed = JSON.parse(specialDay);
    return Array.isArray(parsed) ? parsed.filter((d) => Number.isInteger(d)) : [];
  } catch (e) {
    return [];
  }
}

export function isChefDailyProduct(product) {
  return !!product && product.menu_type === 'specialDay';
}

// Distance from today, walking forward through the week: today = 0, tomorrow = 1.
export function daysFromToday(dayIndex, today) {
  return (dayIndex - today + 7) % 7;
}

/**
 * Build the chef's-daily list: one group per week day, starting at today and
 * wrapping to the end of the week. Days with no food are dropped.
 *
 * @param {Array} products  products as held in index.vue (`key`, `name`, `menu_type`, `specialDay`, …)
 * @param {number} today    week index of today (0=شنبه)
 * @returns {Array<{dayIndex, dayName, isToday, orderable, products}>}
 */
export function buildChefDailyGroups(products, today = todayWeekIndex()) {
  const chefProducts = (products || []).filter(isChefDailyProduct);

  return WEEK_DAY_NAMES
    .map((dayName, dayIndex) => ({
      dayIndex,
      dayName,
      isToday: dayIndex === today,
      // All scheduled days support preorder; checkout validates the selected
      // delivery date against the product's allowed weekdays.
      orderable: true,
      offset: daysFromToday(dayIndex, today),
      products: chefProducts.filter((p) => parseSpecialDays(p.specialDay).includes(dayIndex)),
    }))
    .filter((group) => group.products.length > 0)
    .sort((a, b) => a.offset - b.offset);
}
