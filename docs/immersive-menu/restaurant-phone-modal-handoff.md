# تحویل RESTAURANT-PHONE-MODAL-FIX — 2026-11-24

دامنه فقط چهار اصلاح صریح `user4comments` روی checkout موجود است. یک نویسنده در `D:/lovizefood`،
بدون زیرعامل تو در تو، تغییر وابستگی، commit/push، build کامل یا راه‌اندازی/توقف runtime دیگر.
انتخاب طراحی صریح `design-taste-frontend` خوانده و در کنار `codex-playbook` اعمال شد؛ حفظ
Vue2/Bootstrap/توکن‌ها و طراحی قبلی با variance4، motion2 و density5. قواعد بازطراحی/فرم فقط در
محدودهٔ همین تعمیر اعمال شدند؛ جریان محصول دقیقاً از آخرین دستور کاربر آمده است.

## مسیر، مالکیت و runtime

- `doctor`: پروژه ثبت‌شده، خط single، یک worktree، بدون قفل فعال پروژه در شروع؛ تغییرات متعدد
  قبلی حفظ شدند. override پایدار `task_overrides.RESTAURANT-PHONE-MODAL-FIX.critical=true` زیر قفل
  مجاز ثبت شد. row مستقل B2 به برنامه اضافه شد و وابستگی قبلی تکمیل‌شده بررسی شد.
- `route` و claim هر دو `playbook-critical / gpt-6.1-sol / xhigh` هستند؛ token:
  `399ffdbc-7ab2-450b-aba0-d9cb41d0529a`. منبع انتخاب مدل packet صریح همین درخواست و route است؛
  طبق تأیید بعدی هماهنگ‌کننده spawn صریح Sol/xhigh موفق بوده است؛ مدل داخل worker بازپرسیده نشد و
  worker تو در تو ساخته نشد.
- کاربر ابتدا runtime متعلق به مستر را88773 و سپس98767 روی3333/3003 اعلام کرد. آزمون به سرویس
  موجود متصل شد؛ هیچ‌کدام توسط این نویسنده restart یا متوقف نشدند.
- Playwright MCP یک‌بار `ERR_CONNECTION_REFUSED` برای `http://127.0.0.1:3333/` داد، در حالی که
  درخواست محلی HTTP200 می‌گرفت. طبق مجوز صریح کاربر، یک مرورگر محلی headless و contextهای جدا
  علیه همان runtime استفاده شد. مرورگر MCP هم‌زمان برای خروجی مشابه استفاده نشد؛ مرورگرهای آزمون
  در finally بسته می‌شوند. Playwright و Python از runtime بسته‌بندی‌شده موجود استفاده شدند؛ نصب نشدند.

## تشخیص و اصلاح

Baseline واقعی759×881: پس از هر رقم، `setPhone` و سپس `preview` مقدار bill را null می‌کردند،
debounce200ms آن را برمی‌گرداند، totals و loading/error/retry حذف و اضافه می‌شدند. height فوری
675.328125 و پس از quote741.515625 بود: **66.1875px نوسان**. شمارهٔ معتبر دکمهٔ تمام‌عرض تازه
اضافه می‌کرد و height به806.703125 می‌رسید: **65.1875px تغییر اضافه**.

در `components/immersive-menu/RestaurantCheckout.vue`:

- feedback شماره، چهار ردیف مبلغ، وضعیت quote، خطا و جای دکمهٔ retry همواره فضا دارند. مبلغ
  فاقد quote با placeholder نشان داده می‌شود؛ quote قبلی برای پرداخت نگه داشته نشده است. shell
  ارتفاع طبیعی دارد؛ فقط سقف موجود92vh با92dvh و scroll داخلی body سازگار شد. `height` ثابت یا
  حداقل‌ارتفاع عظیم برای modal تعریف نشده؛ هیچ کنترل انتهایی از دسترس scroll بیرون نیست.
- stepper با `direction:rtl` و `justify-content:flex-start` در راست سلول قرار گرفت؛ کم/زیاد و
  labelهای دسترس‌پذیر قبلی حفظ شدند.
- helper دقیق: «برای مشاهده کدهای تخفیف خود ابتدا شماره همراه خود را وارد و تأیید نمایید.»
- دکمهٔ «تأیید شماره همراه» همیشه در چپ input است؛ شمارهٔ نامعتبر آن را غیرفعال می‌کند. موبایل
  برای سفارش الزامی و تأیید صرفاً برای تخفیف شخصی اختیاری است. payable به verified وابسته نشده است.
- شرط main modal شامل otp است: همان DOM زیر OTP زنده و دیده‌شدنی می‌ماند. wrapper به‌صورت
  declarative `inert` و `aria-hidden` می‌گیرد و dialog هم inert می‌شود؛ Bootstrap stack/focus trap
  بالایی حفظ است. روی بازگشت، inert ancestor نیز پیش از focus برداشته می‌شود تا تأخیر portal مانع
  focus نشود. focus با preventScroll و scroll ذخیره‌شدهٔ همان body/content بازمی‌گردد.
- موفقیت همان discount renderer سبد را نشان می‌دهد؛ پاسخ خالی دقیقاً
  «کد تخفیفی در حال حاضر برای شما وجود ندارد» است. کد اشتباه/ناقص در OTP می‌ماند؛ بازگشت و Escape
  checkout قبلی را بازمی‌گردانند. هیچ نام/نام خانوادگی یا OTP عمومی برای سفارش افزوده نشده است.

`utils/restaurantCheckout.cjs`، adapter، mock، قرارداد و محاسبات مالی، شماره/OTP خصوصی، race guard
A/B، کد عمومی و timer کارت30ثانیه تغییر نکردند. `docs/BACKEND_CHANGES.md` از قبل dirty بود؛ این
تعمیر UI معنای تازهٔ قرارداد/API ندارد و آن فایل توسط این تسک ویرایش نشد. کامنت‌های BACKEND قبلی حفظ‌اند.

## آزمون و شواهد

`test/restaurant-phone-modal.browser.cjs` فقط localhost و runtime موجود را می‌پذیرد. هر درخواست
خارجی مسدود، و online/confirmCard/cancel/order-create با guard مردود می‌شوند؛ برای optional بودن
OTP فقط فعال‌شدن پرداخت آنلاین و بازکردن/ویرایش کارت بدون ارسال درخواست تراکنش بررسی می‌شود.
پاسخ خالی تخفیف و خطای quote صرفاً interception در context آزمون‌اند؛ mock/قرارداد تغییر نکرد.

ماتریس نهایی چهار حالت:759×881 و390×844، روشن و تاریک. در هر حالت 23 وضعیت ورودی واقعی
(خالی، هر رقم0..11، سپس هر Backspace تا خالی) در سه زمان فوری، debounce/loading و settled ثبت می‌شوند:
**276 اندازه‌گیری**، به‌علاوه failure/retry. هم outer rect و هم y/height slotها باید ثابت باشند.

| viewport | تم | عرض modal | ارتفاع modal | x | y | تغییر عرض/ارتفاع/مکان |
|---|---|---|---|---|---|---|
|759×881|روشن|720|810.515625|19.5|70.484375|0px|
|759×881|تاریک|720|810.515625|19.5|70.484375|0px|
|390×844|روشن|390|776.46875|0|67.53125|0px|
|390×844|تاریک|390|776.46875|0|67.53125|0px|

کنترل RTL فاصلهٔ0px از راست محتوای سلول دارد. متن‌ها و هندسهٔ دکمهٔ چپ، خطای شماره، فعال‌شدن
پرداخت بدون verify، کد عمومی، OTP بالاتر با main visible/inert و تنها یک dialog در accessibility،
Tab trap و focus برگشتی، کد غلط/ناقص، cancel/Escape، عدم ارسال دوباره در cooldown، cards و empty،
حفظ reference همان DOM و items/phone/fulfilment/codeInput/appliedCode/scroll، حذف هویت و کارت با
تغییر شماره، نبود نشت در storage/Vuex، نبود clipping کنترل‌های قابل scroll و overflow viewport بررسی شدند.
در هر context فقط دو challenge صریح برای دو شماره؛ **هیچ challenge هنگام تایپ** و **هیچ تراکنش**.

شواهد در `.playwright-mcp/restaurant-phone-modal/`:

- `geometry.json` و `digits-{light,dark}-{759x881,390x844}.json`: تک‌تک rectها و وضعیت‌ها.
- 16 تصویر `stacked-*`، `verified-*`، `empty-*` و `totals-*` برای هر چهار حالت.
- screenshotها فقط شماره و کد مصنوعی fixture دارند. تصاویر نهایی پس از بستن toast مربوط به
  خطای عمدی quote گرفته می‌شوند، نه با پنهان‌کردن خطای محصول.

اجرای مرورگر با `PLAYWRIGHT_MODULE` به Playwright بسته‌بندی‌شدهٔ runtime و
`BROWSER_EXECUTABLE=C:/Program Files/Google/Chrome/Application/chrome.exe`:
`node test/restaurant-phone-modal.browser.cjs`.

آزمون‌های پایه بدون تغییر core:
`node --test test/restaurant-checkout.test.cjs test/restaurant-kiosk.test.cjs test/restaurant-mock.test.cjs test/basket.test.cjs test/basket-store.test.cjs`
**43/43 PASS**؛ شامل دیررس A/B، خصوصی‌ماندن هویت، مرز29.999/30ثانیه و quote/پرداخت/idempotency.
suite قدیمی browser فقط برای دکمهٔ همواره حاضر ولی disabled و selector خطای داخل OTP تطبیق داده شد؛
اجرای کامل پرداخت/ثبت قدیمی در این تسک درخواست نشد و اجرا نشده است.

template Vue و syntax هر دو browser script و `git diff --check` PASS شدند. هشدار LF/CRLF
فایل‌های نامرتبط قبلی از قبل موجود است. قبولی محلی به‌معنی SMS یا پرداخت/backend آمادهٔ production نیست.

## وضعیت نهایی

**STATUS: DONE**. آخرین اجرای کامل چهار مرورگر پس از اصلاح زمان‌بندی focus در portal و آزمون
reachability PASS شد؛ بازگشت focus داخل checkout، حفظ scroll و قابل‌مشاهده‌شدن کامل همهٔ inputها،
stepperها و دکمه‌های کد/پرداخت با scroll بررسی شد. drift هر276 rect و فاصله راست cell دقیقاً0px است؛
pageerror و تراکنش ممنوع صفر. تصویر stack روشن390 و empty تاریک759 و تصاویر موفقیت/جمع موبایل
بصری بازبینی شدند. toast خطای عمدی با دکمهٔ بستن خودش بسته شد و16 تصویر نهایی جایگزین شدند.

runtime اصلی پس از آزمون HTTP200 داد؛ هیچ Chrome headless متعلق به آزمون باقی نماند. ردیف تسک
در برنامه ☑ شد. فقط قفل‌ها و claim همین token در مرز تحویل با workflow آزاد می‌شوند؛ مالکیت هیچ
نشست دیگری دست‌کاری نشده است. اتصال تولیدی/SMS/پرداخت واقعی همچنان خارج از این تحویل است.
