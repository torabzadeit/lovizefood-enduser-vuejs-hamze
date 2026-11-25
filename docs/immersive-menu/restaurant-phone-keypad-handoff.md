# RESTAURANT-PHONE-KEYPAD — worker delivery

Claim `5f5a45cd-8753-4ac8-a35a-c9f017707b25` remains open for master verification and final task-plan/claim handling.

`components/immersive-menu/RestaurantCheckout.vue` contains the readonly `inputmode="none"` phone field, focus on opening and returning from OTP, a single horizontally scrollable row of digits and delete, and physical-keyboard handling. The takeaway mask now points to `assets/immersive-icons/person-walking.svg`, copied from the local Font Awesome Pro Web/svgs/regular pack. SHA-256 hashes match.

Earlier focused tests passed: `node --test test/restaurant-phone-keypad.test.cjs` (4) and `node --test test/restaurant-checkout.test.cjs` (16). They were not repeated for the icon-only change.

On 2026-11-25 the running `localhost:3333/restaurant-mock` was checked in the Codex in-app browser. Basket opening focused the phone input; entering digits and deleting changed its length; a synthetic 11-digit number opened the local mock OTP dialog, and returning restored phone focus. Deleting after return reduced the length to 10 and disabled verification. The walking icon was visually present, and computed mask referenced the new SVG. At 390×844 and 768×1024 all 11 keys shared one row; the 390px row overflowed horizontally, while the tablet row fit. The footer was visible in both screenshots. No payment or order was submitted.

Physical-device native keyboard suppression, screen-reader testing, theme variants and private-card invalidation were not verified in this browser session. A desktop viewport override does not establish real-device behavior. The earlier error `Browser is not available: iab` no longer applies to this session. No service restart, dependency install, commit or push was performed.
