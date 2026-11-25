// Structural validation only, not bank activity or cardholder verification.
// Public reference/vectors: https://github.com/persian-tools/persian-tools#-banking--finance
function normalizeBankCard(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\s-]/g, '');
}

function isValidBankCard(value) {
  const digits = normalizeBankCard(value);
  if (!/^\d{16}$/.test(digits) || /^(\d)\1{15}$/.test(digits)) return false;
  const sum = [...digits].reduce((total, digit, index) => {
    const part = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + (part > 9 ? part - 9 : part);
  }, 0);
  return sum % 10 === 0;
}

function confirmedBankCard(value) {
  return isValidBankCard(value) ? normalizeBankCard(value) : '';
}

function formatBankCard(value) {
  const digits = confirmedBankCard(value);
  return digits.replace(/(.{4})(?=.)/g, '$1 ').replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

module.exports = { normalizeBankCard, isValidBankCard, confirmedBankCard, formatBankCard };
