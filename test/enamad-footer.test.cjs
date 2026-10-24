const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(path.join(__dirname, '..', 'pages', 'index.vue'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'assets', 'scss', 'main.scss'), 'utf8');

assert.match(page, /enamad:\s*\{\s*id:\s*'8159726',\s*code:\s*'BPjiYd4x54ASb7bcPXYqLLO7EyG86QNC'/);
assert.doesNotMatch(page, /if\s*\(resp\.data\.enamad\)\s*this\.enamad\s*=/);
assert.match(styles, /\.laviz-footer__seal\s+img\s*\{[^}]*max-width:\s*48px;[^}]*max-height:\s*48px;/s);

console.log('The footer uses the requested trust seal and keeps it small.');
