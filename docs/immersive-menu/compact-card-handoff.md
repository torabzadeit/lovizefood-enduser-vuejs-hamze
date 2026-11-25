STATUS: DONE — IMMERSIVE-COMPACT-CARD، 2026-11-21.

Skill صریح design-taste-frontend؛ اصلاح حفظ‌کنندهٔ طراحی موجود، بدون redesign یا پکیج جدید. `pages/immersive-menu.vue` کارت اصلی/incoming را در کل viewport مرکز می‌کند: max-width=400، حاشیهٔ 16px در موبایل. طبق اولویت جدید کاربر، gutter قدیمی در صورت لزوم جای خود را به خوانایی و مرکز واقعی می‌دهد. observer فقط هنگام برخورد طبیعی انتهای دسته‌ها با کارت، max-height rail را محدود می‌کند؛ همهٔ دسته‌ها با scroll مستقل قابل دسترسی‌اند و observer در خروج پاک می‌شود.

عنوان 18–20px، توضیح 12px و قیمت 15–17px؛ glass تیرهٔ خنثی با alpha .46/.5 و blur20، متن روشن و touch target44 حفظ شد. عنوان بلند حداکثر دو خط و توضیح بلند scroll می‌شود. pill کوچک مرکز بالای صفحه، نام دستهٔ انتخاب‌شده را با ellipsis و متن کامل accessible/title نشان می‌دهد. گوشه‌های پایین آخرین دسته و rail گرد شدند.

بررسی محدود 657×781 روشن و390×844 تاریک PASS: center=328.5/195، عرض400/358 و ارتفاع134/149؛ بدون overflow. label در category click/swipe/grid/chef، عرض و alignment incoming، long-copy، stepper و cap rail تأیید شدند. تلاش اولیهٔ drag از روی دکمه آغاز شده بود و انتظار incoming timeout شد؛ اجرای صحیح روی سطح gesture موفق بود. تصاویر: `.local-dev/compact-657.png` و `.local-dev/compact-390.png`.

بدون backend/store/auth/مالی، restart یا دست‌کاری runtime34205، commit/push یا build کامل. claim `31842f64-f724-4276-84de-7f8404ca4890` و قفل‌های خود تسک در تحویل آزاد شدند.
