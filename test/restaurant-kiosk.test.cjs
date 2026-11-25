const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { localMockAllowed, verifiedMockScope, verifiedMockBill } = require('../utils/mockRestaurant.cjs');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('late scope success/failure for account A cannot clear or authorize account B', async () => {
  for (const fail of [false, true]) {
    let token = 'A', resets = 0, client;
    const pending = [];
    const source = fs.readFileSync(require.resolve('../plugins/restaurant-mock.js'), 'utf8')
      .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function plugin');
    const context = { localMockAllowed, verifiedMockScope, createLocalAdapter: () => ({}), process: { client: true, dev: true },
      window: { location: { origin: 'http://localhost:3333' } }, localStorage: { getItem: () => token } };
    vm.runInNewContext(source + '\nthis.plugin = plugin;', context);
    context.plugin({ app: { router: { beforeEach() {} } }, store: { commit() { resets++; } },
      $axios: { defaults: { baseURL: 'http://127.0.0.1:3003' }, get() { const result = deferred(); pending.push(result); return result.promise; } } },
    (_, value) => { client = value; });
    const a = client.authorize();
    token = 'B';
    const b = client.authorize();
    pending[1].resolve({ data: { mockOnly: true, scope: 'restaurant:mock', user: { id: 'B' } } });
    assert.equal((await b).token, 'B');
    const before = resets;
    if (fail) pending[0].reject(Error('old request failed'));
    else pending[0].resolve({ data: { mockOnly: true, scope: 'restaurant:mock', user: { id: 'A' } } });
    assert.equal(await a, null);
    assert.equal(resets, before);
  }
});


// Current checkout timing, identity, retries and money invariants live in
// restaurant-checkout.test.cjs; the old mock-only component was superseded.
