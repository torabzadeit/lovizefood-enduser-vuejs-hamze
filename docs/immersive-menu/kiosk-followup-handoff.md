# تحویل IMMERSIVE-KIOSK-FOLLOWUP — 2026-11-22

درخواست جدید روی mock قبلی تکمیل شد؛ تسک قبلی `IMMERSIVE-RESTAURANT-MOCK` دوباره اجرا/نهایی‌سازی
نشده و سابقه‌اش حفظ شد. route و claim این تکمیل `gpt-6.1-sol/xhigh` در `D:/lovizefood`، خط `single`
بود؛ مدل همین worker نیز از metadata نشست تأیید شد. زیرعامل یا orchestrator دیگری ساخته نشد.

## تغییر لازم پس از بررسی

- برخلاف درخواست جدید، منوی قبلی دکمهٔ back با عملکرد logout داشت؛ فقط در restaurantMode حذف شد.
  برگشت از grid و رسید به همان منو حفظ شد. ورود با فرم موجود، شمارهٔ مصنوعی `09000000001` و OTP
  محلی `12345` با `replace` به `/restaurant-mock` می‌رود. شماره در frontend شرط مجوز نیست.
- scope سرور پیش از فعال‌شدن watcherهای مشتری عادی در `registerModal.vue` خوانده می‌شود؛ دستگاه
  درخواست آدرس/پروفایل/کوپن مشتری عادی نمی‌فرستد. plugin و route پاسخ دیررس نشست A را پس از B رد
  می‌کنند و پاسخ شکست A دیگر سبد B را پاک نمی‌کند.
- `restaurantMockBasket` مستقل باقی ماند؛ سبد تبلت نوع داخل رستوران، نام/تعداد/واحد، جمع اقلام،
  مالیات در صورت وجود، جمع نهایی و ثبت mock دارد؛ فرم آدرس، نوع/زمان ارسال، هزینهٔ ارسال و موبایل
  یا کوپن شخصی ندارد. بعد از تأیید سفارش سبد دستگاه خالی و مجوز دستگاه حفظ می‌شود.
- پاسخ preview/create باید مبلغ عددی معتبر، ارسال/تخفیف شخصی صفر، نوع داخل رستوران و وضعیت بدون
  پرداخت داشته باشد؛ پاسخ اشتباه/درگاه پرداخت سبد را پاک نمی‌کند. retry در همان modal، payload/key
  یکسان دارد؛ هنگام ارسال double-submit مسدود و در نتیجهٔ نامعلوم بستن modal مسدود است.
- mock دستگاه فقط catalog عمومی allowlist شده می‌گیرد؛ endpointهای خصوصی و تخفیف شخصی برای
  credential دستگاه، حتی باطل/جعلی، به mock عمومی سقوط نمی‌کنند. مشتری معمولی همان مسیر قبلی دارد.
- fixture ignored `.local-dev/plugin.js` برای پیدا کردن خود منو داخل wrapper رستوران اصلاح شد؛
  همان فیلم/poster مصوب قبلی را استفاده می‌کند. SVG مصنوعی mock به‌عنوان عکس غذا نمایش داده نمی‌شود؛
  محصول فاقد عکس واقعی طبق قاعدهٔ قبلی پس‌زمینهٔ خالی دارد. رسانهٔ عکس‌برداری‌شده fixture محلی است.

## شواهد و آزمون

- `node --test test/restaurant-kiosk.test.cjs test/restaurant-mock.test.cjs test/basket.test.cjs test/basket-store.test.cjs`:
  **30/30 PASS**؛ OTP/TTL/revoke/credential جعلی، منع دادهٔ خصوصی، محاسبات، persisted mock order،
  idempotency، شکست ذخیره، پاسخ دیررس A/B، پاسخ مالی نامعتبر، retry پس از پاسخ گم‌شده و سبد مشترک.
  یکی از آزمون‌های موجود HTTP دو mock مشتری/admin را با پورت آزاد و فایل موقت مستقل اجرا و متوقف
  می‌کند؛ هیچ فایل مخزن admin ویرایش نشد و هیچ API واقعی تماس نگرفت.
- `test/restaurant-kiosk.browser.cjs` با Playwright موجود در npm cache و Chrome headless اجرا شد:
  `768×1024`، `1024×768` و `390×844`، هر دو تم. OTP واقعی UI → route ویژه، نبود back در بالای
  منو، اندازهٔ دقیق viewport، بارگذاری poster موجود، preview/create واقعی mock، ارسال صفر،
  payload بدون هویت/آدرس، پاک‌شدن سبد پس از تأیید، حفظ سبد عادی، browser back، تلاش `/profile`،
  reload و ورود مستقیم `/` بررسی شدند. درخواست خصوصی با credential دستگاه و pageerror برابر صفر.
- context با token عادی و user flag جعلی/همان موبایل ویژه به kiosk راه نیافت؛ checkout عادی با
  روش‌های ارسال و کلید back حفظ شد. ورود مستقیم مهمان به kiosk رد شد. ورود OTP معمولی نیز به‌طور
  مستقل در مرورگر بررسی شد؛ checkout عادی در هر دو تم شاهد دارد.
- template چهار فایل Vue، syntax و `git diff --check` PASS. build کامل production اجرا نشد؛
  بررسی محیط غیرتوسعه با invariant `localMockAllowed(false, ...) === false` و حذف plugin در
  تنظیم production انجام شد. هیچ ادعای آمادگی backend واقعی یا ممیزی امنیت production نداریم.
- تصاویر در `.playwright-mcp/restaurant-kiosk/`: `menu-{light,dark}-{768x1024,1024x768,390x844}.png`،
  `checkout-...png`، `placed-...png` و `ordinary-checkout-{light,dark}-390x844.png` (۲۰ تصویر).
  تصاویر منو/سبد در موبایل و landscape و portrait بازبینی شدند؛ سبد همان bottom sheet موجود است.

## مرزها و ادامه

- قرارداد و تاریخچهٔ بند ۱۸ `docs/BACKEND_CHANGES.md` به‌روز شد. تسک‌های تصمیم‌های واقعی،
  `IMMERSIVE-RESTAURANT-READY`، اتصال production و بررسی مستقل امنیت واقعی **باز** باقی‌اند.
  موبایل اختیاری مهمان، OTP/تخفیف شخصی verified، ابطال اتمیک هویت مهمان و reconciliation تلاش
  پس از reload/crash همچنان قرارداد پیشنهادی بند ۱۶ هستند؛ شمارهٔ خام مجوز/کوپن نمی‌دهد.
- آزمون‌های browser فقط سفارش‌های مصنوعیِ بدون پرداخت به فایل محلی جاری افزودند؛ سفارش قبلی پاک
  نشد. ثبت mock به‌معنای سفارش/پرداخت واقعی نیست. دادهٔ شخصی مهمان یا کارت بانکی اضافه نشد.
- coordinator runtime را در session `38657` راه انداخته؛ در پایان بررسی PIDهای `17180` روی `3333`
  و `7712` روی `3003` زنده بودند. تلاش هم‌زمان worker برای launcher با `EADDRINUSE` خاتمه یافت؛
  هیچ process خارجی متوقف/restart نشد. فرایندهای fixture آزمون خودشان متوقف شدند.
- پیش از نوشتن، doctor **صفر قفل فایل** و بررسی state **هیچ claim این پروژه** نشان داد؛ note مربوط
  به claim قدیمی `abd085bb-2c5d-48b9-925e-87d10984de8f` تاریخی بود و worker چیزی از آن حذف نکرد.
  claim همین تکمیل `38b5f740-1206-4faf-a196-e1e6c1f27ab6` است؛ قفل‌های خودش تا مرز تحویل نگه داشته
  و سپس فقط همان مالکیت آزاد می‌شود. قفل/claim دو پروژهٔ دیگر دست‌نخورده ماند.
- هیچ stage/commit/push، نصب وابستگی، تغییر global playbook یا ویرایش مخزن admin/backend واقعی نشد.
