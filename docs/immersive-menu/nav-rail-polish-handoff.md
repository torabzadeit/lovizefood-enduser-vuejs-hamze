STATUS: DONE — IMMERSIVE-NAV-RAIL-POLISH، 2026-11-21.

طبق اعلام هماهنگ‌کننده پس از مهلت سؤال اختیاری، design-taste-frontend قبلی ادامه یافت. فقط `pages/immersive-menu.vue`: سطح gesture از چپ 16px و از راست rail نیز 16px فاصله دارد؛ next/prev همان جهت و hit target44×48 را دارند، زمینه .08 و opacity آیکن .5 است. focus-visible زمینهٔ خواناتر، آیکن کامل و outline موجود دارد. top back/cart/category selected دست‌نخورده‌اند.

cap rail فقط وقتی کارت و محدودهٔ واقعی دکمه‌های rail افقی هم‌پوشانی دارند اجرا می‌شود؛ 657 دیگر بی‌دلیل به cardTop محدود نیست. در overlap، ارتفاع به ردیف‌های کامل با pitch47 و padding پایین20 محدود می‌شود؛ انتخاب فعال پس از تغییر cap دوباره در دید قرار می‌گیرد. این رفع علت برش است، نه صرفاً border-radius.

بررسی محدود 657×781 و390×844 PASS: inset16، اندازهٔ حداقل44، opacity.5؛ آخرین دکمهٔ 48px در وضعیت عادی/scroll bottom و long-copy کامل است. bounds آخرین دکمه y505–553؛ clipBottom در657 برابر702 و در390 برابر575 بود. تصاویر بازبینی‌شده `.local-dev/nav-rail-657.png` و `.local-dev/nav-rail-390.png`.

بدون backend/store/auth، restart/runtime34205، dependency، build کامل، commit/push. claim `e55094a4-0a0d-4988-b709-c77e991b6006` و قفل‌های همین تسک در پایان آزاد شدند.
