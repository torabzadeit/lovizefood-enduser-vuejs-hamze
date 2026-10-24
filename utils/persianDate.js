const moment = require('moment-jalaali');

function formatJalaliDate(value) {
  if (!value) return '';

  let date;
  if (value instanceof Date) {
    date = moment(value);
  } else {
    const parts = String(value).trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (!parts) return String(value);
    const normalizedDate = `${parts[1]}-${parts[2].padStart(2, '0')}-${parts[3].padStart(2, '0')}`;
    date = moment(normalizedDate, 'YYYY-MM-DD', true);
  }

  if (!date || !date.isValid()) return String(value);

  return date.format('jYYYY/jMM/jDD').replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
}

module.exports = { formatJalaliDate };
