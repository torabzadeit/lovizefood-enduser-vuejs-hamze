// The one date an order card shows: when the order was placed, written out in
// words ("سه‌شنبه ۱۸ آبان ۱۴۰۵"). The order has no other date on its cards; the
// delivery date is not shown.
//
// Uses the browser's own Persian calendar (Intl), in Tehran time, so it needs no
// locale set-up and reads the same on every page.
const FORMAT = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function orderDateText(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  // The browser decides the order of the parts for its locale; the card wants a
  // fixed one: weekday, day, month, year.
  const part = {};
  for (const { type, value } of FORMAT.formatToParts(date)) part[type] = value;
  return [part.weekday, part.day, part.month, part.year].filter(Boolean).join(' ');
}
