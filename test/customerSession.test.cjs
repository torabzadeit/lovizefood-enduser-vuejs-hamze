const assert = require('node:assert/strict');
const test = require('node:test');

let restoreCustomerSession;
try {
  restoreCustomerSession = require('../utils/customerSession.cjs');
} catch (_) {
  // Keep the red test as an assertion that names the missing behavior.
}

function restore(storage, axios) {
  assert.equal(typeof restoreCustomerSession, 'function', 'a customer session restorer must exist');
  return restoreCustomerSession(storage, axios);
}

test('restores a valid customer token and user from persistent browser storage', () => {
  const values = new Map([
    ['token', 'persisted-token'],
    ['user', JSON.stringify({ id: 'customer-1', first_name: 'Ali' })],
  ]);
  const storage = { getItem: (key) => values.get(key) || null };
  let authorization;
  const axios = { setHeader: (name, value) => { authorization = [name, value]; } };

  assert.deepEqual(restore(storage, axios), {
    token: 'persisted-token',
    user: { id: 'customer-1', first_name: 'Ali' },
  });
  assert.deepEqual(authorization, ['Authorization', 'Bearer persisted-token']);
});

test('ignores incomplete or malformed saved customer sessions', () => {
  const storage = { getItem: (key) => key === 'token' ? 'token-without-user' : '{bad json' };
  let headerWasSet = false;
  const axios = { setHeader: () => { headerWasSet = true; } };

  assert.equal(restore(storage, axios), null);
  assert.equal(headerWasSet, false);
});
