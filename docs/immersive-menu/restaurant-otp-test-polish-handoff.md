# تحویل RESTAURANT-OTP-TEST-POLISH، 2026-11-25

هر سه نظر آخر کاربر اجرا و بررسی شدند. یک نویسنده در D:/lovizefood؛ تمام تغییرات قبلی حفظ شد.
AGENTS و آخرین تصمیم‌های صریح کاربر، CLAUDE، codex-playbook، design-taste-frontend انتخاب‌شده،
تحویل قبلی RestaurantCheckout و قرارداد core/adapter/mock خوانده شدند. طراحی قبلی Vue2/Bootstrap
و توکن‌های دو تم حفظ شدند؛ variance4/motion2/density5، فقط اصلاح فرم و لایهٔ OTP.
دستور صریح کم‌رنگ‌بودن placeholder بر توصیهٔ عمومی اسکیل دربارهٔ contrast خود placeholder مقدم است؛
label و متن واقعی شماره همچنان خوانا و بدون تغییرند.

## تغییرهای محدود

- `components/immersive-menu/RestaurantCheckout.vue`: فقط placeholder شماره با selector محدود
  `.rc-checkout-dialog #restaurant-phone::placeholder` و opacity0.35 محو شد.
  رنگ متن واردشده تغییر نکرد. فقط no-close-on-backdrop مودال OTP حذف شد؛ guard بیرون checkout،
  کارت/POS و نتیجه همان است. checkout زیر OTP همان DOM زنده و visible، inert و aria-hidden دارد.
  focus برگشت یک frame پس از teardown پورتال بالایی قرار می‌گیرد تا focus trap قدیمی آن را نگیرد؛
  scroll قبلی بازمی‌گردد. frame هنگام destroy لغو می‌شود.
- `utils/restaurantCheckoutAdapter.cjs` و `plugins/restaurant-mock.js`: قابلیت صریح داخلی
  `otpPrefill(challenge)` فقط با dev===true، صفحه و API روی loopback، gate فعال و owner همان
  دستگاه کار می‌کند. نشانگر mockOnly:true و delivery:local_fixture نیز لازم است. devfalse،
  صفحه/API غیرمحلی یا adapter بدون capability هیچ prefill ندارند.
- `utils/restaurantOtpFixture.cjs` و `dev-mock/restaurant-checkout.cjs`: همان کد واقعی و قبلی
  **246810** بین verifier محلی و adapter مشترک شده؛ مقدار/قواعد mock عوض نشده‌اند. این ماژول
  خالص بیرون پوشهٔ dev-mock است تا import فرونت به پوشهٔ حذف‌شده از Docker وابسته نباشد.
  API هیچ فیلد OTP تازه‌ای ندارد و کد را برنمی‌گرداند. تولید باید adapter واقعی خودش را داشته باشد.
- `utils/restaurantCheckout.cjs`: core عمومی رقم ثابت ندارد؛ فقط capability محلی را پس از
  challenge معتبر مصرف می‌کند. verify خودکار یا bypass وجود ندارد. closeOtp فقط در phase=otp
  نسل identity را عوض و otp/error را پاک می‌کند؛ @hide پس از موفقیت نتیجه را پاک نمی‌کند.
  بستن در حالت درخواستِ در جریان چرخهٔ قدیمی را revoke و quote تازه با همان draft می‌گیرد؛
  پاسخ challenge/verify/discounts قدیمی حتی پس از بازگشایی کنار گذاشته می‌شود. بنابراین challenge
  مصرف‌شده هم بازگشایی را خراب نمی‌کند. مسیر قبلی retry تخفیف پس از verify موفق حفظ شده است.
- `docs/BACKEND_CHANGES.md`: ردیف خلاصه۱۹، قرارداد سرور/پنل/فرونت و تاریخچه به‌روز شدند؛
  هیچ test_code/verify_code به پاسخ محلی یا تولید اضافه نشده است.

## آزمون

`node --test test/restaurant-otp-test-polish.test.cjs test/restaurant-checkout.test.cjs test/restaurant-kiosk.test.cjs test/restaurant-mock.test.cjs`

نتیجهٔ نهایی: **38/38 PASS**. شامل gate صریح dev/loopback/owner، adapter عمومی بدون prefill،
challenge بدون کد، wrong/expired/replay/cooldown، عدم verify خودکار، موفقیت عادی، حفظ draft،
رد پاسخ دیررس challenge/verify/discounts و بازگشایی امن؛ همچنین رگرسیون‌های مالی/مالکیت و POS30s.
یک تغییر کوچک در test قبلی آرگومان صریح dev/pageOrigin را به transport test افزوده تا تست مثبت
دیگر صرفاً به‌دلیل نبود config قطع نشود. template compiler نصب‌شده نیز errors=[] داد.

`test/restaurant-otp-test-polish.browser.cjs` با Playwright MCP و filename کامل اجرا شد؛
**4/4 PASS**، فقط759×881 و390×844 در light/dark، contextهای جدا و بسته‌شده در finally.
هر مورد: computed color/opacity، prefill246810 و نبود auto verify، wrongcode، verify عادی،
کلیک واقعی بیرون، Escape و دکمهٔ بازگشت، همان node/draft/scroll/focus، inert/focus trap،
پاسخ verify واقعاً مصرف‌شده در سرور که تا پس از dismiss نگه داشته شد و سپس نادیده گرفته شد،
بازگشایی و verify چرخهٔ تازه، component عمومی با ورودی خالی، guard بیرون checkout،
عدم نشت storage/overflow و صفر درخواست تراکنش/خطای صفحه. gateهای devfalse/nonlocal دقیقاً
در Node آزموده شدند؛ آزمون مرورگر component عمومی را با همان transport fixture ولی بدون capability
بازسازی می‌کند. build تولید یا تغییر محیط runtime برای شبیه‌سازی production انجام نشد.

| تم | رنگ متن واقعی | رنگ پایهٔ placeholder | opacity | رنگ پس‌زمینه |
|---|---|---|---|---|
| light | rgb(30,24,25) | rgb(106,92,94) | 0.35 | rgb(255,255,255) |
| dark | rgb(242,242,243) | rgb(179,182,187) | 0.35 | rgb(23,24,26) |

placeholder تخفیف همچنان opacity1 دارد؛ رنگ شماره پس از تایپ دقیقاً با پیش از تایپ یکسان است.
16 تصویر نهایی: placeholder/prefilled/verified/dismissed-late برای هر چهار حالت، در
`D:/lovizefood/.playwright-mcp/restaurant-otp-test-polish/`؛ نتیجهٔ قابل‌خواندن ماشین
`results.json`. تصویر failure-light-759.png صرفاً تشخیص اولیهٔ race فوکوس پیش از رفع است.
در مرورگر هیچ SMS واقعی، پرداخت یا ثبت سفارش فراخوانی نشد؛ تست‌های Node فقط factory/سرور mock
مجزای حافظه‌ای/موقت خود را استفاده کردند.

## مالکیت و تحویل

doctor: registered/single، یک worktree، صفر قفل فعال در شروع. override پایدار
`task_overrides.RESTAURANT-OTP-TEST-POLISH.critical=true` و ردیف مستقل برنامه ثبت شد.
route و claim: playbook-critical / gpt-6.1-sol / xhigh، مطابق packet صریح؛ بدون زیرعامل تو در تو
یا بازپرسی مدل داخل worker. claim token: `0fd2744d-d472-4f91-890a-2e4798019cce`.
فایل‌ها با workflow.py قفل شدند؛ در مرز تحویل قفل‌های همین تسک و claim آزاد می‌شوند.
مقایسهٔ SHA256 از فایل‌های قبلی dirty/untracked نشان داد فقط هفت فایل مرتبط موجود عوض شدند؛
تمام فایل‌های قبلیِ نامرتبط همان hash را داشتند. config/برنامه و شواهد/تحویل نیز فقط برای این تسک‌اند.

runtime موجود و تأییدشدهٔ مستر دست‌نخورده ماند:3333 PID32072 و3003 PID28592؛ در پایان listener
همان PIDها را داشت. هیچ port/server تازه، restart/stop، نصب وابستگی، commit/push یا fullbuild انجام نشد.
اتصال production و SMS/پرداخت واقعی همچنان کار مستقل باز در IMMERSIVE-RESTAURANT است.
