# MENU-INITIALIZE-RECOVERY — 2026-11-25

## Result and cause

Fixed the reproduced localhost:3333 menu initialization failure. Both existing services were
running during diagnosis: frontend PID 32072 on 3333 and mock API PID 28592 on 3003; neither was
restarted or stopped. API base observed in the actual browser was http://127.0.0.1:3003.

The mock keeps device grants in an in-memory Map. Restart/revoke/expiry leaves a persisted
`mock-restaurant-` credential without a valid server session. The server correctly rejects its
initialize request with 403. Previously the scope checker returned null without removing the
invalid grant; root then restored it as an ordinary customer and requested private data too.
The shared handler showed the permission toast; root's catch misreported the 403 as a connection
failure and left the menu unavailable. Missing/ordinary synthetic tokens instead returned 200
and 66 products from the same running API. This was not resolved by merely finding the API up.

Before-fix browser network: scope GET 200, initialize GET 403, current/history orders,
addresses and notifications GET 403. Both reported Persian toasts were captured together in
`.playwright-mcp/menu-initialize-before-390.png`.

## Scoped fix

- `plugins/restaurant-mock.js`: before mounting pages, verify only locally classified device
  credentials. Clear `token`, `user` and the axios Authorization default only for an explicit
  `{ "mockOnly": true, "scope": null, "user": null }` response for the SAME current device token.
  Existing generation/token checks protect newer sessions from late A replies. Outages,
  malformed responses, ordinary sessions, nonlocal APIs and production do not trigger cleanup.
  Session verification carries the captured credential explicitly; a confirmed valid device
  also restores its axios header when persisted user data is missing.
- `pages/index.vue`: device credentials never enter ordinary customer restoration. Initialization
  verifies/retries the device scope; valid devices use `/restaurant-mock`, confirmed invalid
  grants recover the public menu, and unavailable verification preserves the grant and exposes
  the existing retry button. The initialization error toast has its own ID and is dismissed
  when retry starts, avoiding a persistent stale error after successful recovery.
- `docs/BACKEND_CHANGES.md` §18, summary and history record this exact existing mock contract.
  Server/private guards, ordinary 401 behavior and backend/admin source were not changed.

After-fix revoked-device browser network: scope GET 200 → credential cleared → public initialize
GET 200 with 66 products; zero customer-private requests, permission toast or connection error.
Restoring device privileges still requires the existing legitimate synthetic challenge/login.
Classification of a token prefix never grants authorization.

## Verification

- `node --test test/menu-initialize.test.cjs test/restaurant-kiosk.test.cjs test/restaurant-mock.test.cjs test/basket-store.test.cjs`: **20/20 PASS**.
  Includes actual mock-factory restart, OTP/TTL/revoke, public-only device catalog, private guard
  rejection, outage/malformed response retention, production/nonloopback exclusion, A/B races,
  missing persisted user, shared basket and existing isolated HTTP tests. Order tests use their
  own temporary synthetic records; no actual customer order or payment was sent.
- `test/menu-initialize.browser.cjs`: **13/13 PASS** against the existing 3333/3003 services using
  headless Chrome and fresh synthetic contexts: public, ordinary, stale ordinary 401/reload,
  missing token, revoked device at root/direct kiosk/direct story, valid device, valid device
  without stored user, plus public/ordinary/valid-device/revoked-device outage and real retry clicks.
  Outage simulation aborts browser requests; it never stops the running API. Ordinary expiry
  uses a controlled 401 since this mock accepts arbitrary ordinary credentials.
- **4/4 direct server denials:** valid/revoked device tokens still receive 403 on addresses and
  active-discount-code endpoints. Zero device-private browser requests or uncaught page errors.
- Actual mock challenge/login creates synthetic device grants; only those grants are revoked
  by cleanup. No real SMS, customer order, payment, or credential logging. Automatic fixture
  seen-writes are intercepted inside the browser tests; personal browser storage is untouched.
- Vue root template compiles; new test files pass syntax checks; `git diff --check` passes
  with existing CRLF warnings. Full production build and real-backend integration were not run.

Run browser suite with the already available Playwright package (no installation):

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\Hamze\AppData\Local\npm-cache\_npx\9833c18b2d85bc59\node_modules\playwright'
node test/menu-initialize.browser.cjs
```

Screenshots and sanitized network evidence: `.playwright-mcp/menu-initialize/results.json` and
17 PNG files in that directory, including `revoked-device-success.png`,
`valid-device-success.png` and `*-outage-retry-{error,success}.png`. The revoked-device and
pre-fix screenshots were visually reviewed. Test screenshots wait for revealed menu cards;
ordinary menu screenshots scroll past existing account banners to show products.

## Ownership and boundaries

Sole-writer task routed by workflow.py as B2 → gpt-6.1-sol/high, lane single.
Claim `aa9d5040-71de-4205-8e84-fd617e1b0c85`; file locks acquired individually before edits.
Only this task's locks/claim are released at delivery. Prior dirty work, unrelated locks and
the two pre-existing machine worker slots are preserved. No dependencies, design changes,
commit, push, foreign-process termination, server authorization weakening or production
readiness claim. Real-backend device security/integration remains independently open.
