# تحویل IMMERSIVE-UI — 2026-11-21

ریشه `D:\lovizefood`، خط `single`، مدل مسیر Terra/medium. مرجع هر دو تم تصویر واحد تأییدشده در `spec.md` است. صفحهٔ `pages/immersive-menu.vue`، دکمهٔ کنار تم در `pages/index.vue` و هفت آیکن انتخابی Font Awesome Pro regular در `assets/immersive-icons/` اضافه شدند؛ پکیج جدید، حالت رستوران، تغییر auth یا موتور قیمت‌گذاری جدید اضافه نشد.

صفحه از store مشترک WIRE، `itemsTotal` با عنوان «جمع قیمت غذاها» و intent یک‌بارمصرف checkout استفاده می‌کند. کاتالوگ مستقیم bootstrap می‌شود؛ دسته به نخستین محصول می‌رود و swipe/دکمهٔ قبلی و بعدی تنها محصول فعال را نشان می‌دهد. دستهٔ فعال در rail قابل مشاهده می‌ماند، بدون حرکت صفحه و با رعایت reduced motion. تصویر واقعی تمام viewport را می‌پوشاند؛ زوم یک‌بار ۱۸ ثانیه، fallback تیرهٔ خنثی، اسکلت بارگذاری، retry، وضعیت خالی/ناموجود و سبد غیرفعال خالی وجود دارد. SVG شناخته‌شدهٔ mock نمایش داده نمی‌شود؛ raster میزبان بدون CORS با fallback آدرس مستقیم قابل نمایش است. کنترل‌ها RTL و دارای نام دسترس‌پذیرند.

`.local-dev/Drawer.vue` صرفاً دکمهٔ محلی را روی مسیر جدید پنهان می‌کند؛ فایل نادیده‌گرفته‌شدهٔ محلی و hook موجود حفظ شدند. `spec.md` وضعیت تاریخی منسوخ gate را مشخص می‌کند؛ backend رستوران همچنان مستقل و آماده‌نبودن آن بدون تغییر است.

## شواهد

- آزمون `node --test test/basket.test.cjs test/basket-store.test.cjs`: ۱۷/۱۷ موفق.
- `test/immersive-ui.browser.cjs` روی سرور توسعهٔ موجود: مهمان و مشتری موفق؛ ورود مستقیم، mock SVG خالی، تصویر raster بدون CORS، رنگ واقعی glass تاریک، دسته/اولین محصول، ۵۰ حرکت با دستهٔ فعال در دید و بدون scroll صفحه، افزودن/کاهش، سبد خالی و intent یک‌بارمصرف؛ هیچ order create و pageerror ثبت نشد.
- QA مستقل گزارش‌شده: ۶۶ محصول در 390 و هر دو تم و سبد مهمان/مشتری موفق؛ اصلاح rail نیز مستقل بعد از ۵۰ حرکت با reduced motion تأیید شد: دستهٔ فعال x=0–54، scroll صفحه (0,0)، یک محصول و بدون pageerror. تصویر: `C:/Users/hamze/AppData/Local/Temp/IMMERSIVE-UX-Q/active-category-fixed-390x844.png`.
- `ui-390.png`: حالت واقعی mock بدون عکس. `ui-photo-fixture.png`: فقط برای آزمون، عکس واقعی از [صفحهٔ نمونهٔ غذا](https://order.tryotter.com/s/pom-grand-persian-grill/10812-82-ave-nw-edmonton/da1d848a-8206-4108-a3f1-f02c6879c7fa/Koobideh%20Meal%20%28HALAL%29/d4386395-ef1d-4557-b703-d150244b4ac0) با interception در حافظه تزریق شد؛ عکس به کد یا کاتالوگ محصول اضافه نشده است.
- `git diff --check` و syntax آزمون موفق؛ هشدار line-ending متعلق به فایل نامرتبط موجود است.
- build تولیدی با `buildDir` ایزولهٔ `.nuxt-immersive-ui-build` و parallel خاموش موفق شد (webpack client، exit 0). هشدارهای اندازهٔ bundle، Sass و نبود `static/icon.png` گزارش شدند؛ runtime روی 3333 تغییر نکرد.
