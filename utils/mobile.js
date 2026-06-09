const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toEnglishDigits(value) {
  if (value == null) return '';
  return String(value).replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(char);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(char);
    if (arabicIndex >= 0) return String(arabicIndex);
    return char;
  });
}

export function normalizeMobileIran(raw) {
  let mobile = toEnglishDigits(raw).replace(/[^\d+]/g, '');

  if (mobile.startsWith('+98')) {
    mobile = `0${mobile.slice(3)}`;
  } else if (mobile.startsWith('0098')) {
    mobile = `0${mobile.slice(4)}`;
  } else if (mobile.startsWith('98') && mobile.length >= 12) {
    mobile = `0${mobile.slice(2)}`;
  } else if (mobile.startsWith('9') && mobile.length === 10) {
    mobile = `0${mobile}`;
  }

  return mobile;
}

export function isValidMobileIran(raw) {
  const mobile = normalizeMobileIran(raw);
  return /^09\d{9}$/.test(mobile);
}
