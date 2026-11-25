// Dedicated development runtime. Never attaches to/restarts the user's servers.
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.CHECKOUT_UI_PORT || 3347), apiPort = Number(process.env.CHECKOUT_API_PORT || 3017);
const apiOrigin = 'http://127.0.0.1:' + apiPort;
process.env.API_URL = process.env.API_URL_BROWSER = process.env.VUE_APP_BASE_URL = apiOrigin;
const api = spawn(process.execPath, [path.join(root, 'dev-mock/mock-api.js')], {
  env: { ...process.env, MOCK_PORT: String(apiPort), LOVIZE_RESTAURANT_MOCK_RECORD: path.join(os.tmpdir(), 'lovize-checkout-isolated', 'old-orders.json'),
    LOVIZE_CHECKOUT_TEST_GATEWAY: process.env.CHECKOUT_GATEWAY_FIXTURE || '0', LOVIZE_CHECKOUT_RETURN_ORIGIN: 'http://127.0.0.1:' + port }, stdio: 'inherit',
});
let nuxt, stopping = false;
async function stop() { if (stopping) return; stopping = true; api.kill(); if (nuxt) await nuxt.close(); process.exit(0); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
api.on('error', error => { console.error(error); stop(); });
(async () => {
  const { loadNuxt, build } = require('nuxt');
  nuxt = await loadNuxt({ rootDir: root, for: 'dev', configOverrides: {
    // Nuxt 2 emits invalid cross-drive relative imports on Windows. Keep this
    // build in its own ignored child; never touch the foreign .nuxt files.
    buildDir: path.join(root, '.nuxt', 'restaurant-checkout-' + port),
    server: { host: '127.0.0.1', port }, telemetry: false,
    build: { quiet: true },
  } });
  await build(nuxt); await nuxt.listen(port, '127.0.0.1');
  console.log('CHECKOUT ISOLATED READY http://127.0.0.1:' + port);
})().catch(error => { console.error(error); api.kill(); process.exitCode = 1; });
