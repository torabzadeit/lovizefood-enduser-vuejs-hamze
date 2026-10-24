const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPage = fs.readFileSync(path.join(__dirname, '..', 'pages', 'index.vue'), 'utf8');

assert.match(
  indexPage,
  /<p[^>]*>\s*\{\{\s*in_person_description\s*\|\|\s*mapCenter\.address\s*\}\}\s*<\/p>/,
  'pickup mode must show the configured pickup description before falling back to the restaurant address',
);
assert.match(indexPage, /:restaurant-address="mapCenter\.address \|\| in_person_description"/);

console.log('pickup mode prioritizes the configured pickup description.');
