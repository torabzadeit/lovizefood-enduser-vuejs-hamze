# تحویل RESTAURANT-CHECKOUT-EXACT — 2026-11-23

## آخرین پیگیری user4comments — 2026-11-24

`RESTAURANT-PHONE-MODAL-FIX` کامل شد؛ تحویل جزئی و شواهد در
`docs/immersive-menu/restaurant-phone-modal-handoff.md` است. چهار اصلاح روی UI موجود اعمال شد:
هندسهٔ ثابت هنگام هر رقم/Backspace و quote/loading/error، stepper راست سلول، helper دقیق، و دکمهٔ
تأیید اختیاری در چپ شماره با OTP روی همان checkout زنده/inert و حفظ draft/scroll/focus.
43/43 unit/HTTP و4/4 مرورگر759×881 و390×844 در دو تم PASS؛276 اندازه‌گیری با drift0px و16 تصویر.
wrong/ناقص/cancel/Escape/cards/empty و سفارش بدون الزام OTP تأیید شدند؛ تراکنش مرورگری ارسال نشد.
core، adapter، mock و قرارداد backend تغییر نکردند. runtime98767 متعلق به مستر روی3333/3003
استفاده و سلامتHTTP200 مشاهده شد؛ این نویسنده آن را restart/متوقف نکرد. اطلاعات runtime پایین تاریخی‌اند.

## یادداشت ماندگار runtime اصلی از مستر — 2026-11-23

پس از بازبینی handoff و تصاویر و تأیید مستر، مستر runtime اصلی متعلق به خودش در نشست `77145` را
به‌صورت graceful متوقف و `dev:mock` تازه را برای بارگذاری API جدید روی `3333/3003` اجرا کرد.
این restart توسط مستر انجام شده است، نه نویسندهٔ checkout؛ توضیحات پایین دربارهٔ دست‌نخوردن runtime
اصلی، سابقهٔ زمان تحویل نویسنده پیش از این اقدام مسترند. health check سرویس تازه نزد مستر در حال
بررسی است؛ این یادداشت موفقیت health check را ادعا نمی‌کند.

در این پیگیری فقط همین سند به‌روز شد؛ source، آزمون‌ها و کامنت‌های اتصال production تغییر نکردند و
هیچ آزمون تازه‌ای اجرا نشد. شواهد نهایی قبلی معتبرند: **43/43 آزمون unit/HTTP** و **6/6 حالت مرورگر**
در موبایل/تبلت و هر دو تم PASS؛ اصلاح متن دقیق نیز در هر شش حالت دوباره تأیید شده است.

## پیگیری کوتاه متن دقیق کاربر — 2026-11-23

اصلاح محدود با قفل‌های `RESTAURANT-CHECKOUT-COPY`، بدون claim/زیرعامل/برنامهٔ تازه طبق مسیر متناسب کار ساده:
برچسب اکشن پس از۳۰ثانیه دقیقاً «سفارش کنسل شد» و گزینه‌های دریافت دقیقاً «بیرون بر» و «سرو در رستوران»
هستند؛ «کارت میکشم» حفظ شد. enum، timer، adapter و منطق مالی/هویتی تغییر نکردند.
suite مرورگر دوباره روی runtime مستقل3347/3017 در هر شش حالت390/768/1024 و دو تم PASS شد؛
برچسب دقیق پس از۳۰ثانیه assert شد. شماره خالی پرداخت را غیرفعال نگه داشت و شمارهٔ جدید پس از پاک‌شدن
verification بدون OTP عمومی سفارش ادامه یافت؛ صفر فرم نام/نام خانوادگی و صفر `POST /api/auth/register`.
۲۴ تصویر قبلی با خروجی نهایی جدید جایگزین شدند؛ card-ready روشن390 و checkout تاریک768 بصری بررسی شدند.
این پیگیری فقط copy/selector/assertion و مشخصات/تحویل است؛ طبق AGENTS بند backend برای copy تغییر نکرد.
پشتیبانی production دوباره مطالبه یا ادعا نشد و کامنت‌های مرج قبلی حفظ‌اند.

STATUS: DONE — بخش فرونت و adapter مستقل محلی طبق دستور صریح کاربر کامل است؛ اتصال production،
SMS واقعی، حساب واقعی مشتری و پرداخت/attestation واقعی ادعا نمی‌شود.

ریشه `D:/lovizefood`، خط `single`، تنها نویسنده و بدون زیرعامل. override پایدار `critical:true` و
route/claim برابر `playbook-critical / gpt-6.1-sol / xhigh` ثبت شد؛ token مالکیت
`f5014466-eabf-44fb-8727-d551be566770`. همه فایل‌ها پیش از ویرایش قفل شدند؛ در مرز همین تحویل فقط
مالکیت همین تسک آزاد می‌شود. مخزن از ابتدا dirty بود؛ بدون stage/commit/push، نصب وابستگی یا build کامل.

## محصول و فایل‌ها

- `components/immersive-menu/RestaurantCheckout.vue` رابط قابل‌اتصال مستقل با prop `adapter/items` است.
  wrapper قبلی `MockRestaurantCheckout.vue` فقط سبد/adapter مجاز محلی را متصل می‌کند؛ منوی تصویری
  و back/logout دستگاه تغییر نکردند. انتخاب صریح کاربر `design-taste-frontend` اعمال شد: حفظ
  Vue2/Bootstrap/توکن‌ها، variance4، motion2 و density5؛ بدون وابستگی یا دارایی تازه.
- جریان دقیق: بیرون‌بر/داخل رستوران، جدول قابل‌ویرایش اقلام و جمع/مالیات/تخفیف/مبلغ؛ موبایل معتبر
  الزامی، ورودی و اعمال کد؛ پس از شماره معتبر مشاهده تخفیف‌ها و modal OTP؛ فقط پس از verify صحیح
  کارت‌های تخفیف همان renderer سبد؛ آنلاین یا «کارت میکشم». هیچ ورود عمومی دستگاه برای مشتری رخ نمی‌دهد.
- `utils/restaurantCheckout.cjs` state خصوصی هر modal/cycle را نگه می‌دارد. شماره فارسی/عربی و قالب
  بین‌المللی مجاز، حروف/طول/قالب غلط مردودند. تغییر شماره کارت‌ها/کد/OTP/quote را پاک می‌کند؛ دیررس A/B
  کنار گذاشته می‌شود. هیچ شماره/OTP/کد/هویت مشتری در Vuex عمومی، localStorage/sessionStorage یا URL نمی‌رود.
- «کارت میکشم» مبلغ quote را نمایش می‌دهد؛ ویرایش از همان ابتدا و با حفظ تعداد، نوع دریافت، شماره،
  verification و کد معتبر فعال است. بازشدن آن هیچ ثبت یا پرداختی ایجاد نمی‌کند؛ دو اکشن تأیید پرداخت و
  سفارش لغو شد تا ۳۰ثانیه کامل در DOM نیستند. زمان خودکار هیچ عملیاتی نمی‌کند. درخواست پرداخت کارت،
  درخواست مشتری برای بررسی است؛ state نتیجه `confirmation_requested` و `payment_status:unverified` است.
- کلید/بدنهٔ frozen در retry ثابت‌اند؛ confirm/cancel/double submit متعارض مسدودند. پاسخ نامعلوم سبد را
  پاک نمی‌کند؛ ویرایش فوراً به checkout برمی‌گردد، اما تلاش قبلی تا نتیجه اجازه ثبت دوم نمی‌دهد.
- `utils/restaurantCheckoutAdapter.cjs` و `dev-mock/restaurant-checkout.cjs` مسیرهای **فقط محلی**
  `/api/enduser/mock/restaurant/checkout/{operation}` را اجرا می‌کنند. اتصال در plugin توسعه و dispatcher
  mock است. نشست/quote/تلاش فقط حافظه‌ای و مستقل از فایل سفارش/admin قبلی است؛ مالکیت محلی فقط hash
  مصنوعی شماره است. مبلغ از کاتالوگ mock محاسبه و quote مصرف‌شده دوباره استفاده نمی‌شود.
- `disconnectedAdapter` خطای عدم اتصال می‌دهد؛ URL/schema تولیدی حدس زده نشده است. آنلاین پیش‌فرض
  محلی هم unavailable است. فقط runtime آزمون، gateway fixture loopback را برای بررسی redirect فعال می‌کند؛
  صفحه fixture پرداخت یا موفقیت واقعی ندارد. query `status=paid` مرجع هیچ نتیجه‌ای نیست.
- کامنت‌های `BACKEND/TODO §19` کنار core، transport، wrapper و attribution mock، و بند۱۹
  `docs/BACKEND_CHANGES.md` شامل API موجود/مرز adapter، مثال JSON، سرور/پنل/فرونت، fallback و تاریخچه‌اند.
  `docs/immersive-menu/spec.md` و برنامه با موبایل الزامی/روش‌های قطعی تازه سازگار شدند؛ OTP عمومی سفارش
  اضافه نشده است. هیچ فایل admin ویرایش نشد.

## شواهد

- `node --test test/restaurant-checkout.test.cjs test/restaurant-kiosk.test.cjs test/restaurant-mock.test.cjs test/basket.test.cjs test/basket-store.test.cjs`:
  **43/43 PASS**. شامل مرز دقیق29.999/30 ثانیه، ویرایش بدون ثبت و حفظ draft، بدون OTP عمومی سفارش،
  wrong/expired/replayed OTP و resend، کد دستی عمومی/شخصی، تغییر شماره، دیررس verify/quote A/B،
  invalid amount/fake paid، lost response، cancel/retry/confirm race، idempotency و reconciliation پس از
  cleanup، دستگاه دیگر، محدودیت transport و رگرسیون سبد/قیمت/نشست قبلی. HTTP قدیمی رکوردهای موقت جدا دارد.
- `test/restaurant-checkout.browser.cjs` با Playwright موجود و Chrome headless روی runtime مستقل
  `127.0.0.1:3347/3017`: **هر شش حالت PASS**؛ 390×844،768×1024،1024×768، هر دو تم. ورود واقعی UI
  حساب مصنوعی دستگاه، دو نوع دریافت، موبایل غلط/فارسی معتبر، کد دستی، OTP غلط/صحیح، کارت verified،
  کنترل تعداد، ویرایش فوری/حفظ draft، تغییر شماره/حذف کارت و کد، درخواست تأیید در روشن و لغو در تاریک
  بررسی شدند. ساعت مرورگر برای30ثانیه جلو برده شد؛ مرز دقیق زیرثانیه در unit مستقل اثبات شد.
- همان browser suite: unavailable آنلاین با پاسخ کنترل‌شده، redirect واقعی به gateway fixture محلی،
  بازگشت، query جعلی بدون نتیجه paid، reload/redirect پروفایل دستگاه، رد مهمان و flag جعلی PASS.
  درخواست خصوصی `/profile` با credential دستگاه، pageerror، نشت مشتری در storage/Vuex و overflow افقی صفر بود.
- `test/basket-wire.browser.cjs`: **مهمان و مشتری هر دو PASS**؛ منو/stepper، initialize، رفت‌وبرگشت
  واقعی immersive، آدرس دستی/پلاک، intent یک‌بارمصرف، login gate، کوپن مشتری و preview عادی 200؛ صفر create.
  guard آزمون به `TEST_API_PORT=3017` محدود شد و stub منسوخِ پیش از ساخت route با خود route واقعی جایگزین شد.
- entry point قدیمی `test/restaurant-kiosk.browser.cjs` اکنون suite جدید را اجرا می‌کند؛ آزمون component
  unpaid قبلی با invariantهای جدید جایگزین شد و آزمون race مجوز دستگاه قبلی حفظ شد.
- ۲۴ تصویر در `.playwright-mcp/restaurant-checkout/`:
  `checkout-*`،`checkout-totals-*`،`card-immediate-*`،`card-ready-*` برای هر شش حالت.
  تصویر جمع/اکشن‌های روشن390، checkout تاریک768 و card-ready روشن390 بصری بازبینی شدند؛ ظاهر فاقد
  متن آزمایشی/هشدار فنی است. همه شماره‌ها/کدهای تصویر fixture عمومی مصنوعی‌اند.
- template هر دو Vue، syntax ابزارها و ۱۴ نمونه JSON backend PASS؛ `git diff --check` PASS با warning
  LF/CRLF فایل‌های نامرتبط قبلی. dev compile موفق؛ Sass/PWA/Browserslist warningهای قبلی موجودند.
- اولین runtime با build روی درایو C به مشکل شناخته‌شده import نسبی Nuxt2 از درایو D خورد؛ فقط helper
  اصلاح شد و build مستقل در `.nuxt/restaurant-checkout-3347` قرار گرفت. runtime نهایی source جدید
  Node mock را پس از restart **متعلق به همین تسک** بارگذاری کرد. هیچ runtime خارجی restart/متوقف نشد.

## اتصال آینده و مرز تحویل

مسئول مرج باید adapter تولیدی را با مجوز device/customer مستقل، SMS واقعی، attribution/ساخت مشتری
از شماره الزامی، quote/currency، idempotency، POS attestation، لغو و callback معتبر متصل کند.
بدون این اتصال، prod route همچنان بسته و adapter پیش‌فرض unavailable است؛ محصول آماده پرداخت واقعی اعلام نمی‌شود.
reconciliation پس از reload/crash، دوام opaque attempt و ابطال اتمیک server-side نیاز سرویس واقعی‌اند.
نباید با حذف guard، تغییر baseURL به production یا استفاده از login/register عمومی دور زده شوند.

کد fixture تخفیف **246810**، کد عمومی `WELCOME` و کد شخصی verified برابر `PERSONAL10` است؛ SMS ارسال
نمی‌شود. ورود دستگاه قبلی همچنان شماره مصنوعی `09000000001` و کد محلی `12345` است. helper مستقل:
`NODE_OPTIONS=--openssl-legacy-provider node test/restaurant-checkout-runtime.cjs`؛ برای gateway fixture
فقط در آزمون `CHECKOUT_GATEWAY_FIXTURE=1`. این helper خودخواسته به سرویس موجود3333/3003 متصل نمی‌شود.
runtime آزمون و contextهای مرورگر در مرز تحویل متوقف می‌شوند؛ cache/تصاویر ignored برای شواهد باقی‌اند.

بررسی نهایی پس از توقف: هیچ listener روی3347/3017 باقی نماند؛ سرویس‌های قبلی3333/3003 همچنان زنده‌اند.
ردیف همین تسک و MAIN-MENU-TOP-GAP در برنامه تکمیل شده‌اند؛ اتصال production باز باقی است.

## تکمیل metadata فاصله منو

طبق درخواست بعدی کاربر، `MAIN-MENU-TOP-GAP` با گزارش PASS نهایی فقط‌خواندنی خود کاربر کامل شد:
کلیک تب با هر سه کارت در899/390، category top60.9 وheader bottom49، wheel/sticky صحیح و بدون overlap؛
ارجاع در `docs/main-menu-top-gap-handoff.md` و تصاویر Temp `menu-click-all-{899,390}-{initial,tab,wheel}.png`.
وجود هر شش تصویر بررسی شد؛ هیچ source مربوط به فاصله/منو در این تسک تغییر نکرد.
