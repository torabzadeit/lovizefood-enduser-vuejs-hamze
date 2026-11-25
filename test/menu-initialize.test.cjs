const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { localMockAllowed, verifiedMockScope } = require('../utils/mockRestaurant.cjs');
const { createRestaurantMock } = require('../dev-mock/restaurant-mock.cjs');
const sample = require('../dev-mock/sample-data.json');
const denied = { mockOnly: true, scope: null, user: null };
const device = 'mock-restaurant-synthetic-expired';
function harness(token, get, { dev = true, api = 'http://127.0.0.1:3003' } = {}) {
  const values = new Map([['token', token], ['user', '{"id":"synthetic"}'], ['laviz_theme', 'dark'], ['unrelated', 'keep']]);
  const headers = [], requests = [];
  let client;
  const source = fs.readFileSync(require.resolve('../plugins/restaurant-mock.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function plugin');
  const context = { localMockAllowed, verifiedMockScope, createLocalAdapter: () => ({}), process: { client: true, dev },
    window: { location: { origin: 'http://localhost:3333' } }, localStorage: {
      getItem: key => values.get(key) || null, removeItem: key => values.delete(key),
    } };
  vm.runInNewContext(source + '\nthis.plugin = plugin;', context);
  const ready = context.plugin({ app: { router: { beforeEach() {} } }, store: { commit() {} }, $axios: {
    defaults: { baseURL: api }, setHeader(...args) { headers.push(args); },
    get(url, config) { requests.push({ url, config }); return get(url, config); },
  } }, (_, value) => { client = value; });
  return { values, client, ready, headers, requests };
}

test('restart invalidates device grants; startup clears only the explicitly denied device before mounting', async () => {
  let mock = createRestaurantMock(sample);
  mock.handle('POST', '/api/auth/check-mobile', { mobile: '09000000001' });
  const login = mock.handle('POST', '/api/auth/login', { mobile: '09000000001', verify_code: '12345' });
  const token = login.body.token;
  mock = createRestaurantMock(sample); // Real restart semantics, no private guard changes.
  assert.equal(mock.handle('GET', '/api/enduser/core/initialize', {}, { authorization: `Bearer ${token}` }).status, 403);
  const h = harness(token, async (url, config) => ({ data: mock.handle('GET', url, {}, config.headers).body }));
  await h.ready;
  assert.equal(h.values.has('token'), false);
  assert.equal(h.values.has('user'), false);
  assert.equal(h.values.get('laviz_theme'), 'dark');
  assert.equal(h.values.get('unrelated'), 'keep');
  assert.deepEqual(h.headers, [['Authorization', false]]);
  assert.equal(mock.handle('GET', '/api/enduser/profile/addresses', {}, { authorization: `Bearer ${token}` }).status, 403);
});

test('ordinary denial, outage, malformed denial and nonlocal/production contexts retain credentials', async () => {
  const cases = [
    ['ordinary', async () => ({ data: denied }), {}],
    [device, async () => { throw Error('API unavailable'); }, {}],
    [device, async () => ({ data: { scope: null, user: null } }), {}],
    [device, async () => ({ data: { ...denied, user: undefined } }), {}],
    [device, async () => ({ data: denied }), { dev: false }],
    [device, async () => ({ data: denied }), { api: 'https://example.invalid' }],
  ];
  for (const [token, get, options] of cases) {
    const h = harness(token, get, options);
    await h.ready;
    await h.client.authorize();
    assert.equal(h.values.get('token'), token);
    assert.equal(h.values.has('user'), true);
    assert.equal(h.headers.length, 0);
  }
});

test('late invalid A response cannot remove a newer B credential or header', async () => {
  let resolve;
  const h = harness(device, () => new Promise(done => { resolve = done; }));
  h.values.set('token', 'ordinary-B');
  h.values.set('user', '{"id":"B"}');
  resolve({ data: denied });
  await h.ready;
  assert.equal(h.values.get('token'), 'ordinary-B');
  assert.equal(h.values.get('user'), '{"id":"B"}');
  assert.equal(h.headers.length, 0);
});

test('device verification sends its credential even when persisted user is missing', async () => {
  const valid = { mockOnly: true, scope: 'restaurant:mock', user: { id: 'synthetic-device' } };
  const h = harness(device, async () => ({ data: valid }));
  h.values.delete('user');
  await h.ready;
  const session = await h.client.authorize();
  assert.equal(session.token, device);
  assert.equal(h.requests.at(-1).config.headers.Authorization, `Bearer ${device}`);
  assert.equal(h.values.get('token'), device);
  assert.ok(h.headers.every(([key, value]) => key === 'Authorization' && value === `Bearer ${device}`));
});
