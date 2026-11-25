const assert = require('node:assert/strict');
const { normalizeBankCard, isValidBankCard, confirmedBankCard, formatBankCard } = require('../utils/bankCard.cjs');
// Public Persian Tools README vectors, never customer financial data.
const card = '6219861034529007';
for (const input of [card, '6219-8610 3452 9007', '۶۲۱۹ ۸۶۱۰ ۳۴۵۲ ۹۰۰۷', '٦٢١٩-٨٦١٠-٣٤٥٢-٩٠٠٧']) {
  assert.equal(normalizeBankCard(input), card);
  assert.equal(isValidBankCard(input), true);
}
assert.equal(isValidBankCard('6037701689095443'), true);
for (const input of ['', null, 6219861034529007, '6219861034529008', '621986103452900', '62198610345290077',
  'a6219861034529007', '6219_8610_3452_9007', '۶۲۱۹x۸۶۱۰۳۴۵۲۹۰۰۷', ...Array.from({ length: 10 }, (_, i) => String(i).repeat(16))]) {
  assert.equal(isValidBankCard(input), false, 'Invalid structure accepted');
  assert.equal(confirmedBankCard(input), '', 'Invalid server value exposed');
}
assert.equal(formatBankCard(card), '۶۲۱۹ ۸۶۱۰ ۳۴۵۲ ۹۰۰۷');
const createMock = require('../dev-mock/mock-core');
const sample = require('../dev-mock/sample-data.json');
const mock = createMock(sample);
assert.equal(mock.handle('GET', '/api/enduser/profile').body.bankCardNumber, null);
assert.equal(mock.handle('PUT', '/api/enduser/profile', { name: 'Fixture', family: 'Family', bankCardNumber: card }).status, 200);
assert.equal(mock.handle('GET', '/api/enduser/profile').body.bankCardNumber, card);
mock.handle('PUT', '/api/enduser/profile', { name: 'Renamed', family: 'Preserved' });
assert.equal(mock.handle('GET', '/api/enduser/profile').body.bankCardNumber, card);
assert.equal(mock.handle('GET', '/api/enduser/profile').body.name, 'Renamed');
assert.equal(mock.handle('PUT', '/api/enduser/profile', { bankCardNumber: '0000000000000000' }).status, 400);
assert.equal(mock.handle('GET', '/api/enduser/profile').body.bankCardNumber, card);
assert.equal(createMock(sample).handle('GET', '/api/enduser/profile').body.bankCardNumber, null);
for (const endpoint of ['login', 'register']) assert.equal(mock.handle('POST', '/api/auth/' + endpoint).body.user.bankCardNumber, undefined);
console.log('PASS card normalization, Luhn, invalid/repeated input, formatting, isolated mock state, auth payload privacy');
