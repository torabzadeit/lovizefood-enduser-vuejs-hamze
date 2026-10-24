const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index.vue'), 'utf8');
const chefTab = fs.readFileSync(path.join(root, 'pages', 'index', 'components', 'chefDailyTab.vue'), 'utf8');
const chefUtils = fs.readFileSync(path.join(root, 'utils', 'chefDaily.js'), 'utf8');

assert.match(indexPage, /<chef-daily-tab[\s\S]*?:products="chefDailyProducts"[\s\S]*?@increase="addChefDailyProduct"/);
assert.match(indexPage, /menuNavCategories\(\)[\s\S]*?CHEF_TAB_ID/);
assert.match(indexPage, /categoryProducts\(categoryId\)[\s\S]*?p\.menu_type !== 'specialDay'/);
assert.doesNotMatch(
  indexPage.match(/addProductCount\(pKey, unit\)\s*\{[\s\S]*?\n    \},/)?.[0] || '',
  /delivery_date\s*===\s*-1/,
  'adding a chef-daily dish to the basket must not require a delivery date first',
);
assert.match(indexPage, /if \(this\.delivery_date === -1\)[\s\S]*?تاریخ تحویل خود را انتخاب کنید/);
assert.doesNotMatch(indexPage, /replace\('\/food\/thumbnail\/', '\/food\/'\)/);
assert.doesNotMatch(chefTab, /:locked="!group\.orderable"/);

// Run the same small, dependency-free utility in Node so behavior is tested,
// not only the wiring in the Vue page.
const utilityModule = { exports: {} };
const executableUtils = chefUtils.replace(/export function /g, 'function ').replace(/export const /g, 'const ')
  + '\nmodule.exports = { todayWeekIndex, buildChefDailyGroups };';
new Function('module', 'exports', executableUtils)(utilityModule, utilityModule.exports);
const { todayWeekIndex, buildChefDailyGroups } = utilityModule.exports;

assert.equal(todayWeekIndex(new Date('2026-09-28T21:00:00.000Z')), 3, 'week day is based on Tehran time');
const groups = buildChefDailyGroups([
  { key: 'today', menu_type: 'specialDay', specialDay: '[2]' },
  { key: 'tomorrow', menu_type: 'specialDay', specialDay: '[3]' },
], 2);
assert.deepEqual(groups.map((group) => group.dayIndex), [2, 3]);
assert.ok(groups.every((group) => group.orderable), 'future special-day foods must be available for preorder');

console.log('chef-daily preorder, dedicated menu, Tehran weekday, and thumbnail preview checks passed.');
