const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const addressForm = fs.readFileSync(
  path.join(__dirname, '..', 'pages', 'profile', 'components', 'addressForm.vue'),
  'utf8',
);
const mapPicker = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'MapPicker.vue'),
  'utf8',
);

assert.match(mapPicker, /\$emit\('update:lat',\s*lat\)/);
assert.match(mapPicker, /\$emit\('update:lng',\s*lng\)/);
assert.match(addressForm, /:lat\.sync="form\.lat"/);
assert.match(addressForm, /:lng\.sync="form\.lng"/);
assert.match(addressForm, /:center-lat="mapCenter\.lat"/);
assert.match(addressForm, /:center-lng="mapCenter\.lng"/);
assert.doesNotMatch(addressForm, /:center-lat="form\.lat/);
assert.doesNotMatch(addressForm, /:center-lng="form\.lng/);
assert.match(addressForm, /v-model="form\.address"/);
assert.match(addressForm, /const address = this\.address \|\| \{\}/);
assert.match(addressForm, /lat: Number\.isFinite\(lat\) \? lat : null/);
assert.match(addressForm, /lng: Number\.isFinite\(lng\) \? lng : null/);
assert.doesNotMatch(addressForm, /@location="onMapLocation"/);

assert.match(addressForm, /hide-header-close/);
assert.match(addressForm, /#modal-header/);
assert.match(addressForm, /address-form-modal-header__close/);

console.log('address form binds map coordinates and provides a custom modal close button.');
