# برنامهٔ محدود درخواست پیام جدید — 2026-11-19

| شناسه | شرح | نوع | مدل | پیش‌نیاز | نقطهٔ آزمون | وضعیت |
|---|---|---|---|---|---|---|
| RESTAURANT-POS-CONTRACT | مستندسازی کلیک کارت میکشم: ثبت فوری سفارش، اعلان پنل ادمین، ارسال به پوز و بازگشت تأیید پرداخت | B | — | RESTAURANT-KEYPAD-TONES-TOTAL | کامنت BACKEND و بند19/جدول/تاریخچه؛ فقط مستندات و کامنت، diff-check موفق؛ Graphify به‌روز؛ docs/immersive-menu/restaurant-pos-contract-handoff.md | ☑ |
| RESTAURANT-FOOTER-TOTAL-FIX | اصلاح دیده‌نشدن مبلغ قابل پرداخت داخل نوار ثابت طبق تصویر کاربر | B | — | RESTAURANT-KEYPAD-TONES-TOTAL | همان design-taste-frontend؛ علت مشخص، مبلغ در footer با تخفیف و اسکرول در516×881 دیده شود؛ بدون تغییر محاسبات؛ IAB و آزمون مرتبط | ☐ |
| RESTAURANT-KEYPAD-TONES-TOTAL | رنگ زمینهٔ ارقام با تیرگی افزایشی و نمایش مبلغ قابل پرداخت در footer ثابت | B | — | RESTAURANT-RESPONSIVE-KEYPAD | design-taste-frontend؛ 23 آزمون موفق؛ IAB390/516/800 و ارتفاع400، کنتراست حداقل7.91، مبلغ هماهنگ با تعداد؛ Graphify update اجرا شد؛ تم تیره و تخفیف بصری آزموده نشد؛ docs/immersive-menu/restaurant-keypad-tones-total-handoff.md | ☑ |
| RESTAURANT-RESPONSIVE-KEYPAD | دو ردیف کلید در عرض کم، رشد عرض کلید در عرض زیاد، افزایش ارتفاع از۴۴ به۵۵ پیکسل و سایهٔ بالای footer پرداخت | B | — | RESTAURANT-PHONE-KEYPAD | design-taste-frontend تأیید شد؛ IAB عرض‌های390/516: 6+5، عرض800: 11کلید؛ ارتفاع55، بدون overflow، footerثابت و سایه؛ 21 آزمون موفق؛ تم تیره فقط بررسی توکن و از نظر بصری تأییدنشده؛ تحویل: docs/immersive-menu/restaurant-responsive-keypad-handoff.md | ☑ |
| RESTAURANT-PHONE-KEYPAD | فوکوس شماره هنگام بازشدن سبد بدون کیبورد نرم‌افزاری؛ یک ردیف ارقام ۰ تا ۹ و حذف رقم آخر؛ آیکن آدم در حال راه‌رفتن برای بیرون‌بر | B | — | RESTAURANT-TABLE-UPDATING | ۴ آزمون keypad و۱۶ checkout؛ مرورگر داخلی فوکوس/ورود/حذف/بازگشت OTP و ردیف واحد390/768؛ آیکن Pro محلی؛ کیبورد دستگاه فیزیکی بررسی نشده؛ docs/immersive-menu/restaurant-phone-keypad-handoff.md | ☑ |
| RESTAURANT-TABLE-UPDATING | نمایش وضعیت به‌روزرسانی در جدول پرداخت رستوران | B | — | RESTAURANT-FIXED-PAYMENT-FOOTER | ۱۶ آزمون واحد موفق؛ جدول و تعداد در مرورگر داخلی؛ محدودیت آزمون تأخیر و اندازه‌ها در docs/immersive-menu/restaurant-table-updating-handoff.md | ☑ |
| RESTAURANT-FIXED-PAYMENT-FOOTER | تثبیت دکمه‌های پرداخت و اصلاح ظاهر خلاصه و آیکن‌ها | B | — | RESTAURANT-CHECKOUT-SUMMARY-LAYOUT | ۴ حالت مرورگر، تایپ، اسکرول، خطا، OTP، آیکن‌ها؛ ۴۳ آزمون واحد؛ docs/immersive-menu/restaurant-fixed-payment-footer-handoff.md | ☑ |
| RESTAURANT-CHECKOUT-SUMMARY-LAYOUT | اصلاح دکمه تأیید، راهنمای تخفیف و جدول خلاصه | B | — | RESTAURANT-PHONE-MODAL-FIX | ۲۸ آزمون واحد و چهار حالت مرورگر دو اندازه و دو تم؛ تصاویر و جزئیات در docs/immersive-menu/restaurant-checkout-summary-layout-handoff.md | ☑ |
| RESTAURANT-OTP-TEST-POLISH | سه نظر آخر: placeholder بسیار کم‌رنگ، prefill فقط adapter توسعه loopback از fixture واقعی، بستن فقط OTP با حفظ checkout و رد پاسخ دیررس | B2 | — | RESTAURANT-PHONE-MODAL-FIX | critical Sol/xhigh؛ 38/38 Node و4/4 مرورگر759×881 و390×844 دو تم PASS؛ fixture246810 بدون auto verify، wrong/expired/late response و همان DOM/draft/scroll/focus؛16 تصویر، صفر تراکنش/restart/fullbuild/deps/commit؛ docs/immersive-menu/restaurant-otp-test-polish-handoff.md | ☑ |
| MENU-INITIALIZE-RECOVERY | رفع شکست initialize با credential دستگاه باطل پس از restart؛ پاک‌سازی فقط grant نامعتبر تأییدشدهٔ mock، حفظ guard خصوصی و مشتری عادی، retry قطع API | B2 | — | — | Sol/high؛ 20/20 unit/HTTP و13/13 مرورگر public/ordinary/device/revoked/missing token و outage/retry؛4/4 guard خصوصی403، صفر private device request؛ `docs/menu-initialize-handoff.md` و17 تصویر؛ بدون restart/SMS/سفارش واقعی/وابستگی/commit | ☑ |
| RESTAURANT-PHONE-MODAL-FIX | user4comments: ثابت‌ماندن ابعاد checkout هنگام هر رقم/حذف موبایل، راست‌چین کنترل تعداد، متن دقیق راهنمای تخفیف و تأیید اختیاری در چپ شماره؛ OTP روی checkout زنده با حفظ draft/scroll و جداسازی A/B | B2 | — | RESTAURANT-CHECKOUT-EXACT | critical Sol/xhigh؛ 43/43 unit/HTTP و4/4 مرورگر759×881 و390×844 دو تم PASS؛ 276 rect با تغییر0px و slot/error/retry پایدار؛ RTL، OTP stack/focus/wrong/ناقص/cancel/Escape/cards/empty، draft/scroll و پرداخت بدون OTP PASS؛ صفر تراکنش/نشت/overflow؛16 تصویر و `docs/immersive-menu/restaurant-phone-modal-handoff.md`؛ runtime98767 سالم، بدون restart | ☑ |
| RESTAURANT-CHECKOUT-EXACT | درخواست صریح 2026-11-23: بیرون‌بر/داخل رستوران، جدول و جمع سبد، موبایل الزامی و مالکیت مشتری، کد دستی و تخفیف شخصی فقط پس از OTP، آنلاین و کارت میکشم با ویرایش فوری و دو اکشن پس از ۳۰ ثانیه؛ adapter محلی مستقل و TODO اتصال واقعی | B2 | — | IMMERSIVE-KIOSK-FOLLOWUP | critical؛ 43/43 unit/HTTP، شش حالت مرورگر در دو تم 390/768/1024، رگرسیون مهمان/مشتری و preview عادی PASS؛ ۲۴ تصویر؛ `docs/immersive-menu/restaurant-checkout-handoff.md`؛ backend واقعی/اتصال production مستقل باز | ☑ |
| MAIN-MENU-TOP-GAP | کاهش فاصلهٔ اضافی بالای نخستین دستهٔ منو با حفظ کارت‌ها، بنر و رفتار هدر و اسکرول | B | — | — | PASS نهایی فقط‌خواندنی طبق تحویل کاربر: کلیک واقعی تب/هر سه کارت در 899 و390، category top60.9 وheader bottom49؛ wheel/sticky صحیح و بدون overlap اولیه؛ `docs/main-menu-top-gap-handoff.md` و `C:/Users/hamze/AppData/Local/Temp/menu-click-all-{899,390}-{initial,tab,wheel}.png` | ☑ |
| IMMERSIVE-KIOSK-FOLLOWUP | تکمیل درخواست 2026-11-22 روی mock موجود: ورود 09000000001 با scope سرور به منوی تمام‌صفحه بدون خروج/back؛ سبد داخل رستوران بدون ارسال/آدرس؛ حفظ مشتری عادی و جداسازی هویت | B2 | — | IMMERSIVE-RESTAURANT-MOCK | Sol/xhigh؛ 30/30 unit/HTTP و ۶ حالت kiosk در دو تم 768×1024، 1024×768، 390×844 PASS؛ OTP عادی/flag جعلی/مهمان و checkout عادی PASS؛ ۲۰ تصویر و `kiosk-followup-handoff.md`؛ فقط mock، production/مهمان verified باز | ☑ |
| IMMERSIVE-NAV-RAIL-POLISH | inset و کاهش شدت کنترل next/prev؛ رفع برش آخر rail | B | — | IMMERSIVE-COMPACT-CARD | 657/390 PASS؛ nav-rail-polish-handoff.md؛ بدون restart | ☑ |
| IMMERSIVE-COMPACT-CARD | کارت شفاف و جمع‌وجور، نام دسته وسط header و گوشهٔ آخر rail | B | — | IMMERSIVE-SIDEBAR-GUTTER | 657/390 PASS؛ compact-card-handoff.md؛ بدون restart | ☑ |
| IMMERSIVE-SIDEBAR-GUTTER | gutter کارت کنار rail، افزودن بدون +، back بالا به راست | B | — | IMMERSIVE-CATEGORY-DEMO | 563/390 PASS؛ sidebar-gutter-handoff.md؛ بدون restart | ☑ |
| PROFILE-REVIEW-FIX | بازگشت پروفایل همیشه به /؛ میانگین معتبر امتیاز محصولات با پرشدن کسری ستاره و ماندگاری mock در همان factory | B2 | — | — | Sol/high؛ unit و مرورگر روشن/تاریک PASS: 4.5، اعشار/بدون امتیاز، failure/reGET/reload، integer click و ۳ مسیر قبلی؛ `docs/profile-review-handoff.md`؛ runtime هنوز restart نشده | ☑ |
| IMMERSIVE-CATEGORY-DEMO | انتخاب صریح emilkowalski-motion و fixture آیکن دسته در plugin توسعهٔ ignored | B | — | IMMERSIVE-CATEGORY-LAYOUT | 708/390 PASS؛ ۹ آیکن مستقل demo، cold click/video و reduced motion؛ بدون restart؛ تکمیل در category-layout-handoff | ☑ |
| IMMERSIVE-CATEGORY-LAYOUT | دسته‌های مربعی متصل در rail راست زیر grid، قرارداد آیکن دسته، تعویض لوگو/back و قیمت/افزودن | B | — | IMMERSIVE-DRAG-MEDIA | 708×1021 و 390 هر دو تم PASS؛ آیکن امن/fallback، scroll/عدم overlap، کارت اصلی/incoming؛ `docs/immersive-menu/category-layout-handoff.md` | ☑ |
| ROUTE-FIRST-CLICK | اصلاح host نصب ویدئوی local از matched route؛ تحویل داخل claim تسک IMMERSIVE-CATEGORY-LAYOUT | G | — | IMMERSIVE-CATEGORY-LAYOUT | first cold header click و root roundtrip در ۴ حالت؛ ویدئو و صفر Nuxt500/console/page errors؛ بدون تغییر root beforeRouteLeave | ☑ |
| IMMERSIVE-DRAG-MEDIA | جهت راست به بعدی، حرکت همراه تصویر/کارت و settle؛ preload و poster ویدئوی فقط محلی | B | — | IMMERSIVE-EXPLORE | 390 touch و 587 mouse PASS؛ poster/decoded/error، preload محدود و loop طبیعی؛ emilkowalski-motion؛ `docs/immersive-menu/drag-media-handoff.md` | ☑ |
| IMMERSIVE-EXPLORE | اصلاح footer/افزودن/لوگو و هاله، drag موس و بررسی loop؛ نمای تمام‌صفحهٔ سه‌ستونی انتخاب محصول | B | — | IMMERSIVE-UI-REFINE | 390 و 587 هر دو تم PASS؛ drag، loop طبیعی، grid و حفظ سبد/عکس خراب؛ `docs/immersive-menu/explore-handoff.md` | ☑ |
| IMMERSIVE-UI-REFINE | اصلاح جای کنترل تعداد و پیکان سبد، پنهان‌کردن trigger محلی، هاله پس از انتخاب طراحی و ویدئوی نمونهٔ صرفاً محلی | B | — | IMMERSIVE-UI | 587×781 و 390 موفق؛ ویدئوی local-only 540×960/1.06MB؛ پخش واقعی و توقف، semantics کنترل‌ها و trigger مخفی؛ `docs/immersive-menu/ui-refine-handoff.md` | ☑ |
| IMMERSIVE-SPEC | تحلیل و تسک‌بندی منوی تصویری تک‌محصولی و حالت سفارش داخل رستوران؛ پرامپت دو تم برای Gemini؛ تعیین وابستگی تأیید تصاویر و قرارداد نشست مهمان | S | — | — | نقشهٔ فایل‌ها، حفظ سبد موجود، جداسازی نشست/تخفیف و فهرست آزمون؛ بدون پیاده‌سازی ظاهر پیش از تأیید | ☑ |
| IMMERSIVE-GEMINI | دو PNG جدید REV2 روشن/تاریک با Gemini؛ طرح استوری بدون هدر، دستهٔ فقط‌آیکن شیشه‌ای و لوگوی شناور | D | Gemini | IMMERSIVE-SPEC | نسخهٔ قبلی superseded و تأییدنشده؛ اصلاح در همان گفت‌وگو ارسال و در حال تولید، مسیرهای جدید منتظر دریافت؛ هدف 390×844، غذای مفهومی فقط طرح | ◐ |
| IMMERSIVE-IMAGE-APPROVAL | تصویر ارسالی کاربر با عبارت «این نسخه تایید شده است» مرجع نهایی چیدمان است | S | کاربر | IMMERSIVE-GEMINI | تأیید صریح 2026-11-21؛ مرجع approved-story-menu.png؛ هدر حذف، دسته فقط‌آیکن و کنترل شیشه‌ای؛ مبلغ و تعداد واقعی از سبد | ☑ |
| IMMERSIVE-DECISIONS | نگاشت backend نوع مشتری خاص، مجوز device/customer، مالکیت مشتری، واحد پول و attestation/ابطال؛ روش محصول در 2026-11-23 قطعی شده است | S | کاربر / مالک backend | IMMERSIVE-SPEC | TODO مرج بند۱۹؛ موبایل الزامی، OTP فقط تخفیف، آنلاین/کارت قطعی؛ نقش پنل مدیریت معادل فرض نشود؛ تکمیل frontend منتظر این اتصال نماند | ☐ |
| IMMERSIVE-CONTRACT | قرارداد پیشنهادی special customer type، مجوز دستگاه، هویت اختیاری مشتری، تخفیف تأییدشده، سفارش ناشناس و ابطال؛ ثبت در BACKEND_CHANGES | A | — | IMMERSIVE-SPEC | critical=true پایدار پیش از claim، Sol/xhigh؛ مستقل از تصاویر؛ سرور/پنل/فرونت، مثال، fallback و بررسی شود؛ بدون کد محصول یا ادعای backend موجود | ☑ |
| IMMERSIVE-CART-CORE | characterization و adapter خالص سبد با تست؛ بدون template، style یا اتصال صفحه | T2 | — | IMMERSIVE-SPEC | critical=true پایدار پیش از claim، Sol/xhigh؛ مستقل از تصاویر؛ واحد/صفر، init/reorder، ارسال/مالیات/سقف، اختلاف تخفیف محصول و جداسازی state؛ بدون اصلاح مالی حدسی | ☑ |
| IMMERSIVE-CART-WIRE | یک store سبد مشترک و intent یک‌بارمصرف برای checkout موجود؛ حفظ منوی اصلی | B2 | — | IMMERSIVE-CART-CORE، IMMERSIVE-IMAGE-APPROVAL | critical=true پایدار پیش از claim، Sol/xhigh؛ رفت‌وبرگشت دو صفحه بدون reset/drift/reorder تکراری؛ checkout عادی ثابت | ☑ |
| IMMERSIVE-UI | صفحهٔ استوری تک‌محصول بدون هدر؛ دکمهٔ ورود کنار تم در منوی اصلی، دستهٔ فقط‌آیکن شیشه‌ای/لوگوی شناور و price/stepper/cart روی عکس تمام‌صفحه | B | — | IMMERSIVE-CART-WIRE، IMMERSIVE-IMAGE-APPROVAL | Terra/medium؛ طبق REV2 تأییدشده و design-taste-frontend؛ عکس واقعی پشت همهٔ کنترل‌ها، دارایی برند واقعی، خوانایی/RTL/safe-area/عدم overlap؛ بدون تغییر auth؛ شواهد `docs/immersive-menu/ui-handoff.md` | ☑ |
| IMMERSIVE-RESTAURANT-READY | تحویل schema و API واقعی نوع خاص، device/customer scopes، verification، order/idempotency و revocation توسط backend | S | کاربر / مالک backend | IMMERSIVE-CONTRACT، IMMERSIVE-DECISIONS | شواهد محیط آزمون و قرارداد تأییدشده؛ mock یا وعدهٔ اجرا به‌معنی تکمیل نیست | ☐ |
| IMMERSIVE-RESTAURANT | اتصال production طبق اصلاح 2026-11-23؛ موبایل الزامی و مالک مشتری، دو نوع دریافت و پرداخت، تخفیف verified و پایان هویت مشتری؛ فرونت محلی در RESTAURANT-CHECKOUT-EXACT | B2 | — | IMMERSIVE-UI، IMMERSIVE-CONTRACT، IMMERSIVE-RESTAURANT-READY، IMMERSIVE-DECISIONS | critical=true؛ قرارداد بند۱۹ و adapter واقعی، SMS/قیمت/پرداخت/ابطال سروری؛ قبولی محلی production را تکمیل نمی‌کند | ☐ |
| IMMERSIVE-RESTAURANT-MOCK | حساب ویژه و سفارش داخل رستوران در پیش‌نمایش محلی | B2 | — | IMMERSIVE-UI، IMMERSIVE-CONTRACT | ورود حساب نمونه، نمای تمام‌صفحه و ثبت سفارش mock | ☑ |
| IMMERSIVE-SECURITY-Q | راستی‌آزمایی مستقل امنیت/قیمت/ابطال و نشت بین مشتری‌ها با backend واقعی | Q | — | IMMERSIVE-RESTAURANT، IMMERSIVE-CART-WIRE | critical=true پایدار پیش از claim، Sol/xhigh؛ enumeration/replay/CSRF، دیررس A/B، reload/back/cache، double-submit و credential قدیمی مردود | ☐ |
| IMMERSIVE-UX-Q | آزمون منوی استوری REV2 و regression checkout عادی؛ بازبینی مرورگر پس از پیاده‌سازی | Q | — | IMMERSIVE-UI | Sol/medium؛ 390×844 هر دو تم، عکس edge-to-edge پشت کنترل‌ها/بدون هدر، لوگوی کوچک، آیکن‌های شیشه‌ای با نام دسترس‌پذیر، یک محصول/بدون overlap، عکس خراب/نام بلند، reduced-motion و سبد مشترک | ☐ |
| IMMERSIVE-DELIVERY | تحویل شواهد نهایی و محدودیت‌ها؛ بدون انتشار حالت رستوران ناقص | G | — | IMMERSIVE-SECURITY-Q، IMMERSIVE-UX-Q | Terra/high؛ approval تصاویر، تست‌ها، قرارداد و مالک backend روشن؛ Git فقط طبق مجوز جاری | ☐ |
| PICKUP-NAVIGATION | اکشن مسیریابی رستوران در کارت سفارش حضوری با استفاده از مسیر موجود و پیش‌نمایش محلی | G | — | — | فقط حضوری؛ مقصد رستوران؛ حفظ اکشن‌ها؛ موبایل هر دو تم | ☑ |
| PROFILE-MESSAGES-ADDRESS | حذف تأیید دستی پیام و خواندن خودکار پس از نمایش؛ سوییچ پیش‌فرض کنار بستن مودال؛ انتخاب پیش‌فرض سبد با حفظ انتخاب دستی | G | — | — | خواندن فقط تب فعال و قابل‌مشاهده؛ سوییچ ذخیره/لغو؛ پیش‌فرض و عدم بازنویسی ورودی دستی؛ موبایل هر دو تم | ☑ |
| MSG-BANNER | بنر پیام خوانده‌نشده، لینک تب پیام‌ها، ثبت دیده‌شدن فقط در تب قابل‌مشاهده، قرارداد و آزمون؛ بدون commit قابلیت؛ تلاش push کامیت موجود | B2 | — | — | مهمان، ورود/بازیابی، poll بدون سفارش، خطا، visibility/cleanup، خواندن و بازگشت، موبایل روشن/تاریک | ☑ |
| MSG-VISUAL | بنر سرتاسری با گوشهٔ صاف، فاصله از تب‌ها و ظاهر مستقل؛ وضعیت ۱۰ بنفش/زعفرانی و برچسب انتظار؛ انتخاب صریح design-taste-frontend | B2 | — | MSG-BANNER | روشن/تاریک در 390 و 624، عرض و فاصلهٔ بنر، وضعیت‌های ۱۰/۱۲/۱۱، حفظ پیام خوانده‌نشده | ☑ |
| REFUND-CARD | پیگیری جدید: اعتبارسنجی هر ورودی بدون خطای طول پیش از ذخیره، حذف بازگشت به سفارش، انتقال خروج به چپ هدر با انتخاب تأییدشدهٔ design-taste-frontend؛ حفظ قرارداد و محافظ نشست/دادهٔ کارت | G | — | — | ارقام جزئی و ۱۶رقمی معتبر/نامعتبر، خطای طول فقط ذخیره، بدون PUT تایپ؛ هدر چپ/لغو و خروج واقعی؛ روشن/تاریک 390 و 515 | ☑ |

دامنه: فقط درخواست فعلی؛ یک نویسنده و بدون واگذاری تو در تو. ظاهر بر اساس الگوهای موجود پروژه.

تحویل IMMERSIVE-CART-WIRE، 2026-11-21: `store/basket.js` به منوی اصلی متصل شد؛ loader مشترک،
تعداد پایدار، intent یک‌بارمصرف و draft خصوصی مهمان/مشتری. ۱۷ آزمون CORE/store و مرورگر مهمان/مشتری
با حفظ آدرس/کوپن و preview عادی موفق؛ بدون story UI یا build کامل. API در `docs/immersive-menu/cart-wire-handoff.md`.

تحویل IMMERSIVE-CART-CORE، 2026-11-21: `utils/basket.cjs` با ۹ export خالص و
`test/basket.test.cjs` با ۱۲/۱۲ آزمون موفق، از جمله ۴۵ حالت برابر با محاسبهٔ واقعی index؛ بدون
تغییر مالی یا اتصال UI. API و نکات حفظ آدرس/reorder برای WIRE در
`docs/immersive-menu/cart-core-handoff.md` است. تصویر تأییدشدهٔ کاربر `approved-story-menu.png`
مرجع نهایی است؛ این تأیید بر یادداشت‌های قدیمیِ منتظر تأیید/تولید در پایین مقدم است. backend مستقل باز است.

پیگیری محدود اسناد `IMMERSIVE-SPEC-REV2`، 2026-11-21: درخواست جدید کاربر برای عکس تمام‌صفحه
مانند استوری، بدون هدر، دسته‌های فقط‌آیکن با زمینهٔ شیشه‌ای محو و لوگوی کوچک شناور در spec،
prompt و پذیرش UI/UX ثبت شد. عکس پشت کنترل‌های خوانای قیمت/تعداد/سبد تا لبه‌ها ادامه دارد؛
safe-area و تک‌محصول حفظ می‌شوند. هماهنگ‌کننده اصلاح را در همان گفت‌وگوی Gemini
`https://gemini.google.com/app/b3c44d0cc06b82a9` ارسال کرده؛ دو تصویر جدید در حال تولید و مسیرها
هنوز اعلام نشده‌اند. تصاویر قبلی فقط سابقهٔ تولید، superseded و تأییدنشده‌اند؛ ردیف تولید
برای REV2 باز و تأیید تصاویر همچنان باز است. قرارداد backend و سایر کارها حفظ؛ بدون کد محصول،
تعامل Gemini، build یا claim تازه برای این اصلاح کوچک؛ فقط قفل‌های همین پیگیری در تحویل آزاد می‌شوند.

تحویل IMMERSIVE-CONTRACT، 2026-11-21: بند ۱۶ `docs/BACKEND_CHANGES.md` فقط قرارداد پیشنهادی با
بازاستفادهٔ scoped از API فعلی، مجوز دستگاه/هویت گذرا، قیمت/ابطال/idempotency و fallback است؛
جزئیات و حدود بررسی در `docs/immersive-menu/contract-handoff.md`. schema و پشتیبانی واقعی backend،
تصمیم‌های رستوران و تأیید تصاویر همچنان بازند؛ تکمیل این ردیف مجوز پیاده‌سازی UI یا اعلام readiness نیست.

تحویل IMMERSIVE-SPEC، 2026-11-21: مشخصات قابل‌بازبینی در `docs/immersive-menu/spec.md` و
به‌روزرسانی مرز تحویل: دو PNG واقعی از `https://gemini.google.com/app/b3c44d0cc06b82a9` دانلود و
به کاربر نمایش داده شدند؛ generation تکمیل و تأیید تصاویر همچنان منتظر کاربر است.
مسیرها: `C:/Users/hamze/.codex/visualizations/2026/11/14/01a1dbe1-e56e-7ee1-9c30-981cc33a3651/loviz-immersive-menu/gemini-light.png`
و `C:/Users/hamze/.codex/visualizations/2026/11/14/01a1dbe1-e56e-7ee1-9c30-981cc33a3651/loviz-immersive-menu/gemini-dark.png`.
هر دو PNG با ابعاد native برابر 1376×3078 تأیید ساختاری شدند؛ برابر هدف 390×844 نیستند.
این یادداشت وضعیت نهایی و مقدم بر گزارش قبلیِ دانلود در حال انجام در پایین است.

ادامهٔ گزارش اولیه: مشخصات در `docs/immersive-menu/spec.md` و
پرامپت Gemini در `docs/immersive-menu/gemini-prompt.md` نوشته شد. `route` برای این تسک برابر
`S → gpt-6.1-sol/high` و claim منتقل‌شده متعلق به همین ریشه/خط بود؛ بدون زیرعامل یا کد محصول.
انتخاب `design-taste-frontend` و تعریف نوع مشتری خاص وابسته به شمارهٔ ADMIN سیستم از پیام جدید
ثبت شد؛ خود شماره و schema حدس زده نشد و سطح دسترسی پنل مدیریت معادل این نوع فرض نشد.
دو طرح مفهومی Gemini طبق گزارش هماهنگ‌کننده تولید شده‌اند:
`https://gemini.google.com/app/b3c44d0cc06b82a9`؛ دریافت PNG کامل و مسیر نهایی/تأیید کاربر هنوز
باز است، بنابراین GEMINI در حال انجام و IMAGE-APPROVAL باز می‌مانند. مرجع‌های عمومی پاک
`immersive-public-{light,dark}.png` جای screenshotهای اولیهٔ دارای customer state هستند.
غذای تصویری Gemini فقط concept است؛ عکس مفقود تولیدی همچنان خالی می‌ماند.

دو تسک مستقل قبل از تأیید تصویر، `IMMERSIVE-CONTRACT` و `IMMERSIVE-CART-CORE` هستند؛ اجرای آنها
با packet بعدی هماهنگ‌کننده است. هر دو و نیز CART-WIRE/RESTAURANT/SECURITY-Q حساس‌اند: پیش از
claim باید هماهنگ‌کننده زیر قفل مجاز config، `task_overrides.<id>.critical=true` را پایدار کند
و route را دوباره بگیرد؛ این تحویل محدود به docs مجوز تغییر `.codex/playbook.json` نداشت.
معماری سبد مشترک باید reset فعلی `setProduct()`، اختلاف نمایش تخفیف محصول با total خام، احیای
Authorization از localStorage و خروج فعلی فقط‌محلی را در نظر بگیرد. قرارداد server-side
device/customer verification/revocation پیشنهادی است؛ API واقعی در این مخزن نیست و mock create
برابر 501 است. آزمون محصول/پرداخت/امنیت backend در این تسک ادعا نمی‌شود. runtime روی 3333
دست‌نخورده، بدون commit/push؛ فقط قفل‌ها و claim همین تسک در مرز تحویل آزاد می‌شوند.
بررسی متن سه سند، ۱۳ شناسهٔ یکتا و وابستگی بدون دور/مرجع گم‌شده، ۳۷ ارجاع فایل/شماره‌خط،
حفظ دروازهٔ user-only تصاویر و `git diff --check` موفق بود. مسیر Gemini صریحاً external-model
ماند؛ route حساس دو تسک مستقل با `--critical` فقط preview برابر Sol/xhigh بود و override
پایدار/claim آنها انجام نشد. پیاده‌سازی یا آزمون محصول در این تسک اجرا نشده است.

تحویل PICKUP-NAVIGATION، 2026-11-20: دکمهٔ مسیریابی در ردیف مستقل کارت سفارش فقط برای `iWillCome` و به‌جز وضعیت ۱۱، با مسیر `openNavigation` موجود و اتصال پیش‌نمایش محلی. آزمون مرورگر روی runtime موجود با جایگزینی `window.open` موفق: وضعیت‌های ۱۰/۱۲/۱۳ حضوری، حذف دکمه برای پیک/اسنپ/ردشده، حفظ تماس و جزئیات/رسید و مقصد هر دو کارت. عرض ۳۹۰ و ۵۸۷ در هر دو تم بدون overflow و هدف حداقل ۴۴px؛ تصاویر `.playwright-mcp/pickup-navigation-{light,dark}-{390,587}.png`. تصویر روشن ۳۹۰ و تاریک ۵۸۷ بازبینی شد. بدون API یا وابستگی تازه، commit/push یا توقف runtime.

تحویل PROFILE-MESSAGES-ADDRESS، 2026-11-20: حذف رابط و درخواست ack؛ seen پس از بارگذاری و نمایش در تب فعال و قابل‌مشاهده، با حفظ وضعیت هنگام شکست. انتخاب `isDefault` در سبد و محافظ انتخاب دستی/متن/موقعیت؛ سوییچ فرم در هدر با انتخاب design-taste-frontend طبق فرض اعلام‌شده. قرارداد سرور در بندهای ۷، ۱۲ و ۱۵ به‌روز شد. آزمون‌های `test/management-notifications.browser.cjs` و `test/profile-address-scoped.browser.cjs` موفق؛ آزمون آدرس از پاسخ کنترل‌شده استفاده می‌کند و پایداری سرور واقعی را اثبات نمی‌کند. تصاویر 390 روشن/تاریک در `.playwright-mcp/address-switch-{light,dark}-390.png` بازبینی شد. بدون commit/push و بدون تغییر پردازه‌های موجود.

تحویل پیگیری جدید REFUND-CARD، 2026-11-20: کاربر دامنهٔ تازهٔ بالا را به همان پیاده‌ساز با مسیر
تأییدشدهٔ `G → gpt-6.1-sol/xhigh` واگذار کرد؛ ردیف فقط برای همین دامنه دوباره باز و اکنون تکمیل
شد. تحویل قبلی در پایین محفوظ است. اعتبارسنجی و حذف لینک ابتدا انجام شد؛ سپس پس از دریافت انتخاب
صریح `design-taste-frontend`، خروج با همان SVG و همان handler/تأیید موجود به چپ فیزیکی هدر رفت.
رویکرد حفظ طراحی قبلی، variance 4، motion 2 و تراکم قبلی است. target آیکن 44×44 با aria-label/title
است و دکمهٔ خروج پایین حذف شد. آیکن/وابستگی تازه‌ای اضافه نشد.

در `pages/profile/components/bankCardForm.vue` اعتبارسنجی computed وابسته به هر input است: حروف
غیرمجاز فوراً، در ۱۶ رقم نتیجهٔ checksum/رقم تکراری یا «ساختار شماره کارت صحیح است.» نمایش داده
می‌شود؛ عدد ناقص یا بیش‌از۱۶رقم تا کلیک ذخیره خطای طول نمی‌دهد. خطای طول با تایپ بعدی دوباره
مخفی می‌شود. پیام موفقیت ساختار از «شماره کارت ذخیره شد.» جداست؛ تأیید GET/PUT/readback، حریم خصوصی
و محافظ نشست تغییر نکردند. لینک «بازگشت به سفارش» حذف شد؛ دکمهٔ بازگشت هدر برقرار است.

- `test/refund-card-followup.browser.cjs`: **PASS** روی runtime واقعی همان `3333/3003`، بدون
  interception API یا restart. هر یک از ۱۵ رقم فارسی جداگانه بررسی شد، رقم شانزدهم معتبر،
  ورودی عربی با فاصله/خط تیره، checksum غلط، تکراری، حرف غیرمجاز، طول کوتاه/خالی/بیش‌از۱۶
  هنگام ذخیره و رفع خطای طول پس از تایپ بررسی شد. پیش از ذخیرهٔ صریح معتبر **صفر PUT** بود.
  فقط یک happy flow واقعی با **یک PUT و دو GET** (پروفایل تازه + readback)، پاک‌شدن input و نبود
  PAN در localStorage/sessionStorage/URL موفق بود.
- هندسهٔ خروج چپ، target حداقل44، یکتایی آیکن، نبود خروج پایین و لینک حذف‌شده، بدون overflow
  در 390/515 و هر دو تم تأیید شد. تأیید موجود با متن قبلی باز می‌شود؛ لغو نشست را حفظ و خروج
  واقعی token/user و Authorization را پاک کرده و فرم/دادهٔ کارت را unmount کرد. runtime error نبود.
- screenshotها در `.playwright-mcp/refund-card-followup/profile-live-valid-{light,dark}-{390,515}.png`
  ثبت و دو تصویر روشن390/تاریک515 بصری بازبینی شدند؛ فقط fixture عمومی استفاده شد.
- انتظار قدیمی خطای عمومی و لینک حذف‌شده در `test/refund-card.browser.cjs` به خطای دقیق طول و
  دکمهٔ بازگشت هدر به‌روز شد. syntax هر دو فایل آزمون و `git diff --check` موفق بود؛ مجموعهٔ قبلی
  و build کامل تکرار نشدند. فایل‌های محصول این پیگیری فقط فرم کارت و `pages/profile.vue` هستند؛
  قرارداد بک‌اند، mock، تنظیمات محلی و سایر کارهای ثبت‌نشده تغییر نکردند. بدون commit/push و بدون
  توقف runtime؛ قفل‌ها و claim متعلق به این پیگیری در مرز تحویل آزاد می‌شوند.

تحویل REFUND-CARD، 2026-11-20: مسیر ثبت‌شدهٔ `G` با override پایدار `critical: true` برابر
`gpt-6.1-sol/xhigh` بود. پیاده‌ساز تنها نویسنده بود؛ زیرعامل تازه، commit یا push ایجاد نشد.
طراحی، افزودن محدود به محصول موجود با variance 4، motion 2 و تراکم قبلی است؛ Vue2/Bootstrap،
توکن‌ها، آیکن‌ها و کارهای ثبت‌نشدهٔ قبلی حفظ شدند. متن سیاست بازگشت فقط در وضعیت ۱۱ است؛ هیچ
عملیات انتقال وجه یا تغییر وضعیت سفارش انجام نمی‌شود. شمارهٔ کارت فقط از پروفایل همان نشست
و در حافظه استفاده می‌شود؛ CTA به `/profile?tab=bank-card` و focus فرم مستقل می‌رود.
قرارداد پیشنهادی `bankCardNumber` در GET/PUT همان پروفایل، اعتبارسنجی ساختاری، حفظ نام/نام خانوادگی
با GET تازه و الزام GET همسان پس از PUT در بند ۱۴ `docs/BACKEND_CHANGES.md` ثبت شد. پشتیبانی واقعی
سرور، کنترل‌های مجوز/عملیات مالی و اجرای مهلت اعلامی همچنان «بررسی شود» است.

- `node test/bank-card.test.cjs`: PASS؛ ارقام فارسی/عربی/ASCII، فاصله/خط تیره، طول، حروف، Luhn،
  ارقام تکراری، فرمت، حافظهٔ mock، حفظ کارت در ویرایش نام و نبود PAN در login/register.
- `test/refund-card.browser.cjs` با Playwright موجود و Chrome headless در حالت controlled: PASS؛
  لینک/focus، نام/نام خانوادگی محفوظ، invalid بدون PUT، 200 نادیده‌گیرنده بدون موفقیت جعلی،
  خطای PUT بدون انعکاس PAN سرور، GET/retry، شکست readback، خروج و پاسخ دیررس، مهمان و وضعیت‌های
  ۱/۲/۱۰/۱۲/۱۳ بدون UI بازگشت. هیچ PAN در localStorage/sessionStorage/URL نبود؛ runtime error نداشت.
- آزمون زنده با `REFUND_TEST_MODE=actual`: **PASS، بدون هیچ route interception برای GET/PUT**.
  نمونهٔ واقعی mock روی `localhost:3003`، ذخیرهٔ fixture عمومی، GET تأیید، بازگشت صفحهٔ اول،
  انتخاب ۱۱ در Drawer ignored، نمایش کارت و reload + انتخاب مجدد ۱۱ موفق بود. این آزمون پیش
  از restart صادقانه با `Running mock has not reloaded the bankCardNumber contract` شکست خورد.
  تلاش این پیاده‌ساز برای Ctrl+C نشست `89623` فقط `Unknown process id 89623` داد و هیچ پردازه‌ای
  متوقف نشد؛ مالک اصلی Epicurus همان نشست را با Ctrl+C عادی متوقف و همان foreground
  `npm.cmd run dev:mock` را اجرا کرد. نشست جاری `45180`، Nuxt PID `34344` روی `3333` و API PID
  `17668` روی `3003` است؛ مالک نگه‌داری runtime همان نشست است. مخفی‌سازی پردازه یا پورت تازه نبود.
- screenshotهای واقعی در `.playwright-mcp/refund-card/`: `actual-rejected-no-card-{light,dark}-390.png`،
  `actual-profile-confirmed-{light,dark}-{390,515}.png` و `actual-rejected-saved-{light,dark}-{390,515}.png`.
  نسخه‌های controlled نیز با همان نام بدون `actual-` موجودند. هر دو تم/عرض بدون overflow افقی
  و گروه‌های چهاررقمی فارسی با `bdi dir=ltr` بررسی شدند. فقط fixture عمومی Persian Tools استفاده شد؛
  اطلاعات واقعی بانکی ارسال/ثبت/تصویربرداری نشد. mock جاری این fixture عمومی را برای مشاهدهٔ جریان
  کارت ثبت‌شده در حافظه نگه می‌دارد؛ restart عادی آن را پاک می‌کند.
- HMR/کامپایل dev موفق، `git diff --check` و syntax mock موفق؛ build کامل/آزمون نامرتبط تکرار نشد.
  hook محلی `nuxt.config.js` و Drawer ignored باقی‌اند و برای commit باید طبق دستور قبلی بررسی شوند؛
  این تسک آن تنظیم محلی یا خط محصول `loadingIndicator` را تغییر نداد. فایل‌های قفل‌شدهٔ همین تسک
  پس از تحویل آزاد می‌شوند؛ قفل یا claim نشست دیگر دست‌کاری نشد.

تحویل MSG-VISUAL، 2026-11-20: انتخاب صریح کاربر `design-taste-frontend` با حفظ محصول فعلی،
variance 4، motion 2 و تراکم قبلی. تغییر فقط `components/ManagementMessageBanner.vue`،
`pages/index/components/activeOrderCard.vue` و توکن‌های مختص این دو در `assets/scss/_design-tokens.scss`.
بنر با همان API/link/poll، سطح شرابی روشن/ذغالی تاریک، آیکن زعفرانی و راهنمای «مشاهده پیام» است.
وضعیت ۱۰ فقط، برچسب «در انتظار تأیید» و بنفش/زعفرانی می‌گیرد؛ ۱۲ سبز و ۱۱ نارنجی حفظ شدند.
HMR موفق و بررسی هدفمند مرورگر در هر دو تم: عرض بنر `0..390` و `0..624`، شعاع `0px`، فاصلهٔ
بالا حدود `20.33px` (گردکردن ارتفاع هدر)، پایین `24px` و ارتفاع `72px`؛ بدون overflow افقی.
در viewport 1024، بنر داخل canvas 720 با لبه‌های `152..872` ماند. حالت reduced-motion حفظ شد.
تصاویر در `.playwright-mcp/management-messages/`: `visual-10-{light,dark}-390x844.png` و
`visual-10-{light,dark}-624x771.png`؛ تصاویر وضعیت‌های ۱۲ و ۱۱ در 390 نیز ثبت شدند.
وضعیت‌های آزمون فقط در مرورگر بودند؛ در پایان وضعیت واقعی از API دوباره خوانده شد و پیام نمونه
با `unseenCount: 1` باقی ماند. قرارداد بک‌اند، mock سفارش، پرداخت و بسته‌ها تغییر نکردند؛
طبق دامنهٔ تأییدشده build کامل و آزمون گسترده اجرا نشد. بدون commit یا push.

تحویل 2026-11-19: قابلیت پیاده‌سازی و آزمایش شد؛ هیچ فایل stage یا commit نشد. مسیر B2 از
`workflow.py route` برابر `gpt-6.1-sol/high` بود؛ بدون زیرعامل.

- آزمون `test/management-notifications.browser.cjs` با `PLAYWRIGHT_MODULE` اشاره به Playwright موجود
  در npm cache اجرا شد: همگی PASS. شامل مهمان بدون درخواست/تایمر، ورود واکنشی و بازیابی نشست، بنر
  بدون متن خصوصی، لینک مستقیم پیام‌ها، PUT فقط برای IDs دیده‌شده، پاک‌شدن بنر پس از بازگشت، پیام
  تازه با اجرای callback تایمر ۳ دقیقه‌ای بدون سفارش فعال، حفظ بنر در 503، توقف در سند مخفی و
  تازه‌سازی پس از بازگشت، سایر تب‌ها بدون seen، query نامعتبر، URL/back، خروج و جواب دیررس.
- mock factory: خوانده‌شدن در همان factory حفظ می‌شود و factory تازه صندوق نمونه را بازنشانی می‌کند.
  بررسی مستقل visibility listener در رفت‌وبرگشت صفحهٔ اول/پروفایل/صفحهٔ اول: `1 → 1 → 1`، بدون نشت.
- تصویرهای 390×844 در `.playwright-mcp/management-messages/`: `home-light-390x844.png` و
  `home-dark-390x844.png` با popup بسته؛ `profile-messages-success-390x844.png` در نشست تازه با
  `GET 200` و `PUT 200`، بدون toast خطا. toast تصویر اولیه متعلق به تست عمدی 503 بود.
- production build با Nuxt اصلی و تنها `buildDir: .nuxt/messages-production-check` برای حفظ dev server
  موفق شد: `Client: Compiled successfully in 41.93s` و `MESSAGES PRODUCTION BUILD PASSED`، exit 0.
  هشدارهای موجود Sass، PWA icon و اندازهٔ bundle باقی‌اند. تلاش‌های اولیهٔ helper به مسیرهای Windows
  نامناسب برخورد کردند؛ تنظیمات پروژه تغییر نکرد و پردازه‌های همان helper متوقف شدند.
- `git diff --check` و بررسی syntax فایل mock و آزمون موفق. آزمون‌های قبلی قبل از تغییر: ۷ از ۸
  موفق؛ `test/address-form.test.cjs` از قبل انتظار قدیمی `:lat.sync="form.lat"` دارد و شکست می‌خورد؛
  خارج از دامنه حفظ شد.
- push مجاز کامیت قبلی اجرا شد ولی احراز هویت Git شکست خورد:
  `fatal: Cannot prompt because user interactivity has been disabled.` و
  `fatal: unable to get password from user`. HEAD همان `22febe333c2f895adfe25af801d6c3c637cad41a` است؛
  شاخه نسبت به `origin/claude/uiux-review` یک commit جلوتر است. ورود Chrome جای احراز هویت Git نشد؛
  force یا استخراج اطلاعات ورود انجام نشد.
- پردازهٔ قبلی mock API روی 3003 باید توسط صاحب آن restart شود تا تغییر read-state را بارگذاری کند.
  آزمون‌ها از factory تازه و پاسخ‌های کنترل‌شدهٔ مرورگر استفاده کردند؛ پردازه‌های قبلی دیگران متوقف نشدند.
