# تحویل IMMERSIVE-CATEGORY-LAYOUT و ROUTE-FIRST-CLICK — 2026-11-21

STATUS: DONE. ریشه `D:\lovizefood`، خط single، claim اولیه `97414451-26ff-42e0-a49f-05c67d7d0272`؛ sole writer. انتخاب صریح بعدی کاربر **emilkowalski-motion** است و فرض قبلی design-taste-frontend را برای این مرحله جایگزین می‌کند. موقعیت‌ها دوباره طراحی نشدند؛ feedback فشردن دسته با transform/opacity به‌مدت 160ms و fallback reduced motion تطبیق داده شد. بدون commit/push، restart، dependency، build کامل یا تغییر auth/مالی.

## UI و آیکن

- `pages/immersive-menu.vue`: rail عمودی راست با grid در بالا و دسته‌های مربع 48px متصل زیر آن؛ scroll مستقل، نام‌های دسترس‌پذیر، انتخاب فعال و glow حفظ شدند. ارتفاع کارت اصلی/ورودی با ResizeObserver اندازه‌گیری می‌شود تا rail پیش از کارت تمام شود؛ observer در خروج پاک می‌شود. کنترل قبلی/بعدی از زیر rail خارج شد. reveal دستهٔ فعال عمودی است.
- back راست و لوگو چپ؛ add/quantity چپ و قیمت راست، در کارت اصلی و incoming. grid و gesture و state سبد حفظ شدند.
- پاسخ فعلی `GET /api/enduser/core/initialize` و snapshot فقط category id/text دارند. مخزن `D:/lovizefood-admin` فقط‌خواندنی بررسی شد: `src/pages/products.vue` و `legacy/src/view/components/Admin/Products/Category/ProductCategoryModal.vue` تنها title را ذخیره می‌کنند؛ قرارداد آیکن فعلی پیدا نشد. هیچ فایل پنل تغییر نکرد.
- `store/basket.js` فیلد اختیاری **پیشنهادی** `categories[].iconKey` را فقط از enum ثابت می‌پذیرد. UI آن را به SVG bundled نگاشت می‌کند، بدون HTML/SVG injection، CSS یا URL از سرور. هفت SVG لازم دیگر از پک محلی FA Pro regular انتخاب شد؛ کل پک یا وابستگی تازه وارد نشد. مقدار مفقود/نامعتبر/تکراری به شمارهٔ ترتیبی محلی یکتا تبدیل می‌شود، نه حدس از نام غذا. دستهٔ مجازی غذای روز آیکن محلی مستقل دارد.
- `docs/BACKEND_CHANGES.md` بند ۱۷، جدول و تاریخچه شامل enum، مثال، endpointها، فایل‌های admin و fallback است. mock این مخزن فیلد iconKey نگرفت؛ آیکن داده‌ای فقط در fixture آزمون تزریق شد. پشتیبانی واقعی backend/admin هنوز **بررسی شود**.

## ROUTE-FIRST-CLICK (در همین claim)

`.local-dev/plugin.js` همچنان ignored است. مشکل شناسایی host از DOM `story.__vue__` رفع شد: هنگام client navigation آن مرجع می‌توانست transition wrapper بدون basket باشد. اکنون instance از matched route انتخاب می‌شود که `$el === story` و computed basket معتبر دارد؛ reuse guard، prop، stored host و guard نصب، همگی همین host را مصرف می‌کنند. `pages/index.vue` و root beforeRouteLeave تغییر نکردند.

## شواهد محدود

- `node --test test/basket-store.test.cjs`: **۶/۶ PASS**؛ شامل enum و رد HTML، SVG، javascript/data/HTTP URL، prototype-name، نام ناشناخته و نوع غیررشته‌ای؛ محاسبات و state isolation موجود نیز موفق.
- `test/immersive-category-layout.browser.cjs`: **708×1021 و 390×844، روشن/تاریک PASS**. هر مورد از منوی اصلی تازه شروع شد و **دکمهٔ واقعی header برای اولین ورود** کلیک شد، ویدئو واقعاً پخش شد؛ بازگشت root و ورود دوباره بدون Nuxt500، console error یا pageerror موفق بود.
- مربع‌های متصل زیر grid، هندسهٔ back/logo و add/price در اصلی/incoming، پایان rail پیش از کارت و عدم overlap با کنترل gesture، نمایش دستهٔ آخر، grid سه‌ستونی و Esc، counts و position حفظ‌شده تأیید شدند؛ order create صفر.
- روشن: fallback فعلی بدون iconKey و شماره‌های یکتا. تاریک: fixture با enumهای مستقل؛ همهٔ دسته‌های دارای محصول، source مستقل دریافت کردند. این fixture شاهد پشتیبانی سرور واقعی نیست.
- تصاویر بازبینی‌شده: `.local-dev/category-{708,390}-{light,dark}.png` و `.local-dev/category-incoming-390.png`. نسخهٔ تاریک شامل iconKeyهای fixture و نسخهٔ روشن fallback واقعی mock است.
- test قدیمی explore برای rail عمودی به‌روز شد؛ matrix کامل قدیمی/۶۶ محصول یا build تکرار نشد. `git diff --check` موفق است؛ هشدار line-ending فایل نامرتبط موجود حفظ شد.

قفل‌ها و claim همین task در مرز تحویل آزاد می‌شوند تا نویسندهٔ بعدی به‌صورت serial کار کند.

## تکمیل IMMERSIVE-CATEGORY-DEMO

claim تکمیل: `d95b1230-bd96-4558-ae20-392494e422d0`. `.local-dev/category-demo.js` و response interceptor در `.local-dev/plugin.js`، **فقط پاسخ mock loopback پورت 3003** برای initialize را با iconKeyهای مستقل تزئین می‌کنند؛ مقدار واقعی موجود را جایگزین نمی‌کنند. این fixture ignored است، در production بارگذاری نمی‌شود و ثبت آیکن در admin نیست. خاموش‌کردن `enabled`، یا flag آزمونی `window.__lovizeDisableCategoryFixture` پیش از bootstrap، fallback اصلی را برمی‌گرداند. matrix قبلی برای سناریوی نبود فیلد، fixture را صریحاً خاموش می‌کند.

دو بررسی محدود تازه در 708 و 390 با **کلیک واقعی header و بدون route interception آزمون** موفق شدند: هر ۹ دستهٔ دارای محصول آیکن مستقل دارد، marker عددی صفر، ویدئو پخش می‌شود، console/page errors صفر و transition در reduced motion برابر 0s است. پاسخ خام شبکه هنوز iconKey ندارد؛ پس آیکن‌های دیده‌شده صرفاً demo محلی‌اند. restart لازم نشد. تصاویر: `.local-dev/category-demo-708.png` و `.local-dev/category-demo-390.png`.
