# RESTAURANT-RESPONSIVE-KEYPAD — worker handoff

Status: **DONE for master review**. Claim `d0bfc112-cc0f-4d8b-9311-8cd538a6dfc8` remains open for master review and finish.

On 2026-11-25, `components/immersive-menu/RestaurantCheckout.vue` changed CSS only: six equal grid columns below 700px (6+5 keys), eleven at and above 700px, 55px-high keys, and an upward footer shadow. `test/restaurant-phone-keypad.test.cjs` replaces the obsolete single scrolling-row assertion with the responsive CSS contract. Existing financial, phone and OTP logic was not edited. No backend change, build, dependency installation, server restart, commit or push.

Built-in IAB at `http://localhost:3333/restaurant-mock`, light theme, viewport height 844px:

| Width | Rows | Key width | Height | Keypad scroll/client width |
|---|---|---|---|---|
| 390 | 6+5 | 57.44–57.45px | 55px | 365/365px |
| 516 | 6+5 | 77.10–77.11px | 55px | 483/483px |
| 800 | 11 | 58.78–58.79px | 55px | 687/687px |

All 11 buttons appeared in the accessibility tree. At 516px the footer top remained 758.80px as body scroll moved from 0 to 259.33px; computed shadow was `rgba(0, 0, 0, 0.16) 0px -6px 16px 0px`. A 516px screenshot was displayed in the worker session. The documented screenshot API returns image bytes but provides no file-save path, so no screenshot artifact was saved. Viewport override was reset.

In the earlier IAB check on the same component, digit and delete worked; an 11-digit synthetic number opened the mock OTP dialog; returning restored phone focus and deleting disabled verification. No OTP verification, order or payment was submitted.

`node --test test/restaurant-phone-keypad.test.cjs test/restaurant-checkout.test.cjs`: **21 passed, 0 failed**.

Dark theme was not visually tested: the mock exposed no theme selector, and navigating to the root returned to the mock. No forced page-state changes or alternative browser were used. Source token inspection shows keypad text/surface contrast ratios of approximately 17.50:1 light (`#1e1819`/`#ffffff`) and 15.88:1 dark (`#f2f2f3`/`#17181a`); border/surface ratios are approximately 1.39:1 and 1.53:1 respectively, so the actual dark edge and shadow visibility remain unverified. Physical-device and screen-reader testing were not performed.
