const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const compiler = require('vue-template-compiler');
const createMock = require('../dev-mock/mock-core');
const sample = require('../dev-mock/sample-data.json');

function component(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const parsed = compiler.parseComponent(source);
  assert.deepEqual(compiler.compile(parsed.template.content).errors, [], file + ' template');
  const script = parsed.script.content.replace(/^import .*;\r?\n/gm, '').replace('export default', 'module.exports =');
  const sandbox = { module: { exports: {} }, StarRating3d: {}, orderDateText() {} };
  vm.runInNewContext(script, sandbox, { filename: file });
  return sandbox.module.exports;
}

const history = component('pages/profile/components/orderHistory.vue');
const stars = component('pages/profile/components/starRating3d.vue');
const modal = component('pages/profile/components/reviewModal.vue');
const ratingOf = order => history.methods.ratingOf(order);
const lines = ratings => ratings.map((rating, index) => ({ count: index ? 100 : 1, review: { rating } }));
assert.equal(ratingOf({ items: lines([5, 4, 0, null]) }), 4.5);
assert.equal(ratingOf({ orderItems: lines([1.5, '4.25']) }), 2.875);
assert.equal(ratingOf({ rating: 2, items: lines([5, 4]) }), 4.5);
const invalid = [null, undefined, 0, '', ' ', false, true, [], {}, NaN, Infinity, -1, .7, 5.1, 'bad'];
assert.equal(ratingOf({ rating: 5, items: lines(invalid) }), 0, 'Explicit unrated data blocks stale aggregate');
assert.equal(ratingOf({ items: lines([...invalid, 5, 4]) }), 4.5);
for (const value of invalid) assert.equal(ratingOf({ rating: value }), 0);
assert.equal(ratingOf({ rating: '4.5', items: [{ review: { comment: 'legacy' } }] }), 4.5);
assert.equal(ratingOf({ items: [] }), 0);
assert.equal(ratingOf(null), 0);
for (const [value, expected] of [[4.5, [1, 1, 1, 1, .5]], [2.875, [1, 1, .875, 0, 0]], [0, [0, 0, 0, 0, 0]]]) {
  const ctx = { value, label: 'امتیاز', displayValue: stars.computed.displayValue.call({ value }) };
  assert.deepEqual([1, 2, 3, 4, 5].map(n => stars.methods.fill.call(ctx, n)), expected);
  assert.ok(stars.computed.valueLabel.call(ctx).includes(value ? 'از ۵' : 'هنوز امتیازی'));
}

const demo = createMock(sample);
const endpoint = '/api/enduser/profile/orders';
const order = demo.handle('GET', endpoint).body.find(o => o.orderNumber === '10431');
const reviewPath = endpoint + '/' + order.id + '/review';
const getReview = () => demo.handle('GET', reviewPath).body;
const getOrder = () => demo.handle('GET', endpoint).body.find(o => o.id === order.id);
const ids = getReview().items.map(i => i.productId);
const post = ratings => demo.handle('POST', reviewPath, { ratings });
assert.equal(post([{ productId: ids[0], rating: 5, comment: ' fixture ' }, { productId: ids[1], rating: 4 }]).status, 200);
assert.deepEqual(getReview().items.map(i => i.rating), [5, 4]);
assert.equal(getReview().items[0].comment, 'fixture');
assert.equal(getOrder().rating, 4.5);
assert.equal(ratingOf(getOrder()), 4.5);
const before = JSON.stringify(getReview());
for (const ratings of [[], [{ productId: ids[0], rating: 1 }, { productId: ids[1], rating: 6 }], [{ productId: 'unknown', rating: 5 }], [{ productId: ids[0], rating: true }]]) {
  assert.equal(post(ratings).status, 400);
  assert.equal(JSON.stringify(getReview()), before, 'Rejected batch must not mutate prior reviews');
}
assert.equal(post([{ productId: ids[0], rating: 2.5 }]).status, 200);
assert.deepEqual(getReview().items.map(i => i.rating), [2.5, 4]);
assert.equal(ratingOf(getOrder()), 3.25);
assert.equal(createMock(sample).handle('GET', reviewPath).body.items[0].rating, 0, 'Factory lifetime only');
const answered = demo.handle('GET', endpoint).body.find(o => o.orderNumber === '10377');
const answeredPath = endpoint + '/' + answered.id + '/review';
const answeredItem = demo.handle('GET', answeredPath).body.items[0];
demo.handle('POST', answeredPath, { ratings: [{ productId: answeredItem.productId, rating: 4 }] });
assert.equal(demo.handle('GET', answeredPath).body.items[0].adminReply, answeredItem.adminReply);

(async () => {
  let emitted = 0, closed = 0;
  const ctx = { enabledItems: [{ productId: ids[0] }, { productId: ids[1] }], orderId: order.id,
    draft: { [ids[0]]: { rating: 5 }, [ids[1]]: { rating: 0 } },
    $axios: { post: async (url, body) => { assert.equal(url, reviewPath); assert.equal(body.ratings.length, 1); throw new Error('fixture failure'); } },
    $bvToast: { toast() {} }, $emit() { emitted++; }, close() { closed++; } };
  await modal.methods.submit.call(ctx);
  assert.equal(emitted, 0); assert.equal(closed, 0); assert.equal(ctx.saving, false);
  ctx.$axios.post = async () => {};
  await modal.methods.submit.call(ctx);
  assert.equal(emitted, 1); assert.equal(closed, 1);
  console.log('PASS averages, validation/unrated fallback, fractional fill, isolated POST/GET persistence and failure atomicity, factory reset, admin reply, modal success/failure; Vue templates compile');
})().catch(error => { console.error(error); process.exitCode = 1; });
