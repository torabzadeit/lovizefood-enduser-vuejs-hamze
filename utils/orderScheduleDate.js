const tehranDateFormatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
  timeZone: 'Asia/Tehran',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toTehranDayKey(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    const dateOnly = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]);
      const day = Number(dateOnly[3]);
      const check = new Date(Date.UTC(year, month - 1, day));
      if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        return null;
      }
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = tehranDateFormatter.formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  return year && month && day ? `${year}-${month}-${day}` : null;
}

function isOrderScheduledForTodayOrLater(order, now = new Date()) {
  const scheduledValue = order?.deliveryDate || order?.createDate;
  const scheduledDay = toTehranDayKey(scheduledValue);
  const today = toTehranDayKey(now);
  return Boolean(scheduledDay && today && scheduledDay >= today);
}

module.exports = { isOrderScheduledForTodayOrLater };
