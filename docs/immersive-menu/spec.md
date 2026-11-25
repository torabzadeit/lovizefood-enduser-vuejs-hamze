# مشخصات منوی تصویری و حالت رستوران — IMMERSIVE-SPEC

## اصلاح صریح checkout — 2026-11-23

این درخواست بر بندهای قدیمی «موبایل اختیاری/سفارش ناشناس/پرداخت نامشخص» مقدم است:
۱) «بیرون بر» یا «سرو در رستوران»؛ ۲) جدول اقلام/تعداد/قیمت و جمع مانند سبد؛ ۳) کد دستی و اعمال؛
۴) موبایل مشتری الزامی و معتبر، سفارش متعلق به مشتری؛ ۵) پس از شماره معتبر «مشاهده تخفیف‌ها» →
modal OTP و challenge/verify در adapter → فقط پس از تأیید صحیح کارت‌های تخفیف همان مشتری؛
۶) آنلاین → URL معتبر درگاه از adapter؛ ۷) «کارت میکشم» → modal مبلغ با ویرایش فوری/حفظ draft،
فقط پس از ۳۰ ثانیه دکمه‌های «تأیید پرداخت» و «سفارش کنسل شد». زمان به‌تنهایی اقدامی انجام نمی‌دهد.

OTP برای همهٔ سفارش‌ها اجباری نیست؛ احراز مشتری برای تخفیف مستقل از مجوز دستگاه است. تأیید کارت
درخواست مشتری است و ادعای settlement ندارد. انتخاب همین تسک `design-taste-frontend` با حفظ Vue2،
Bootstrap و توکن‌های موجود است. کاربر تکمیل فرونت و adapter مستقل محلی را با backend آماده‌نشده
مجاز کرده است؛ مسیر/schema تولیدی حدس زده نمی‌شود و TODO اتصال در کد و بند ۱۹ BACKEND_CHANGES ثبت است.
این مجوز انتشار production یا ادعای SMS/پرداخت واقعی نیست. تسک `RESTAURANT-CHECKOUT-EXACT` شامل
مراحل متوالی core/adapter، UI و verification در یک نویسنده با route حساس است؛ اتصال production مستقل می‌ماند.

## مرجع نهایی تأییدشدهٔ کاربر — 2026-11-21

کاربر تصویر پیوست را صریحاً تأیید کرده است؛ فایل پایدار مرجع:
`C:/Users/hamze/.codex/visualizations/2026/11/14/01a1dbe1-e56e-7ee1-9c30-981cc33a3651/loviz-immersive-menu/approved-story-menu.png`.
این تأیید و ردیف `IMMERSIVE-IMAGE-APPROVAL` بر همهٔ گزارش‌های قدیمی «منتظر تأیید/تولید» در پایین
مقدم‌اند. چیدمان نهایی: استوری بدون هدر، آیکن دستهٔ شیشه‌ای، لوگوی شناور و کنترل قیمت/تعداد/سبد
روی عکس. تصویر مرجع، عکس محصول تولیدی نیست؛ endpoint فعلی mock طبق README تصویر SVG رنگی دارد.
فقط عکس واقعی محصول در صورت وجود استفاده شود؛ عکس مفقود خالی می‌ماند. آمادگی backend مستقل است.
تحویل CORE و API قابل‌اتصال در `cart-core-handoff.md`؛ اتصال store/UI در تسک WIRE انجام می‌شود.

## سابقهٔ اصلاح طراحی REV2 — 2026-11-21 (وضعیت تأیید زیر منسوخ است)

درخواست جدید کاربر: «مثله استوری های اینستاگرام تصویر تمام صفحه باشه و هدر بالا کلا نباشه. انتخاب دسته ها فقط آیکن باشه و شیشه ای محو باشه پشت آیکن ها. یه جای مناسب برای لوگو هم در نظر بگیره.» این اصلاح بر قواعد بصری نسخهٔ اول مقدم است؛ قرارداد backend، سبد و هویت تغییر نمی‌کند. شناسهٔ پیگیری محدود اسناد `IMMERSIVE-SPEC-REV2` است؛ claim قبلی تمام شده و برای این اصلاح کوچک claim تازه لازم نیست.

هماهنگ‌کننده اصلاح را در همان گفت‌وگوی Gemini `https://gemini.google.com/app/b3c44d0cc06b82a9` فرستاده است؛ دو خروجی جدید روشن/تاریک در حال تولید گزارش شده‌اند و مسیر آنها هنوز اعلام نشده است. فایل‌های `gemini-light.png` و `gemini-dark.png` قبلی فقط سابقه‌اند، **تأیید نشده و با REV2 جایگزین شده‌اند**. تأیید کاربر صرفاً برای دو خروجی جدید درخواست می‌شود؛ gate پیاده‌سازی UI همچنان بسته است.

به‌روزرسانی نهایی تحویل: generation در `https://gemini.google.com/app/b3c44d0cc06b82a9` تکمیل شد؛ فایل‌های `gemini-light.png` و `gemini-dark.png` در `C:/Users/hamze/.codex/visualizations/2026/11/14/01a1dbe1-e56e-7ee1-9c30-981cc33a3651/loviz-immersive-menu/` دانلود و توسط هماهنگ‌کننده به کاربر نمایش داده شدند. هر دو PNG با اندازهٔ native برابر **1376×3078** هستند، نه هدف 390×844؛ بررسی ساختار فایل انجام شد. **تأیید تصاویر هنوز منتظر کاربر است.** این وضعیت مقدم بر گزارش‌های قبلیِ دانلود در حال انجام در متن است؛ generation تکمیل، gate پیاده‌سازی UI بسته است.

تاریخ: 2026-11-21؛ خط `single`، ریشه `D:\lovizefood`. تحویل این تسک فقط همین سند، `gemini-prompt.md` و ردیف‌های مرتبط `docs/task-plan.md` است؛ هیچ کد محصول، mock، قرارداد اجرایی یا تنظیم مدل تغییر نمی‌کند. مدل مسیر این تسک: `S → gpt-6.1-sol/high`؛ claim منتقل‌شده از هماهنگ‌کننده. بدون زیرعامل، commit/push یا دست‌کاری runtime موجود روی `3333`.

## تصمیم‌های قطعی و دروازه‌ها

- منوی اصلی حفظ می‌شود. دکمه‌ای **کنار دکمهٔ تم** صفحهٔ مستقل منوی تصویری را باز می‌کند؛ مسیر پیشنهادی `/immersive-menu` است.
- صفحهٔ تصویری مانند استوری، **بدون هدر بالا** است؛ عکس واقعی یک محصول از لبه تا لبهٔ کل viewport و پشت همهٔ کنترل‌ها ادامه دارد. دسته‌ها فقط آیکنِ قابل‌مشاهده، شناور روی زمینهٔ شیشه‌ای محو دارند؛ بدون عنوان متنیِ ثابت، با نام فارسی دسترس‌پذیر. لمس دسته دقیقاً به اولین محصول آن دسته می‌رود؛ فقط یک محصول، بدون محصول نیمه‌نمایان، تکرار یا شبکه.
- لوگوی واقعی برند کوچک و شناور در محل خوانا و داخل safe-area قرار می‌گیرد، بدون ساخت هدر یا نوار برند. زوم عکس بسیار آرام است؛ قیمت و «افزودن» که به «− / تعداد / +» تبدیل می‌شود و جمع/سبد ثابت، به‌صورت کنترل‌های شناور خوانا پایین روی عکس قرار دارند؛ بدون پنل بزرگی که عکس را کوتاه کند، بدون overlap و با همان سبد و همان قیمت‌گذاری منوی اصلی.
- `design-taste-frontend` به‌صراحت انتخاب شده است. برداشت طراحی: منوی ایرانی با تمرکز بر اشتها و عکس، آرام و خوانا؛ پارامترهای پیشنهادی: `DESIGN_VARIANCE 6 / MOTION_INTENSITY 3 / VISUAL_DENSITY 3`. پیشنهاد طراحی است، نه تأیید تصویر یا مجوز تغییر چارچوب.
- سابقه: کاربر Gemini و دو طرح روشن/تاریک خواسته بود؛ خروجی‌ها در گفت‌وگوی `https://gemini.google.com/app/b3c44d0cc06b82a9` تولید شدند. تصمیم بعدی کاربر این شرط را تغییر داد: تصویر واحد `approved-story-menu.png` مرجع تأییدشدهٔ هر دو تم است.
- دروازهٔ تصویر با تأیید صریح همان تصویر واحد باز است؛ تأیید جداگانهٔ دو خروجی قدیمی لازم نیست.
- تفسیر طرح مفهومی: Gemini می‌تواند غذای فوتورئالیستی **تصویری و مفهومی** تولید کند؛ این مجوز استفادهٔ تولیدی یا ادعای عکس واقعی رستوران نیست. مرجع فعلی عکس واقعی مناسب ندارد؛ در محصول نهایی عکس مفقود یا خراب، سطح خالی دارد و دارایی جعلی ساخته نمی‌شود.
- حالت رستوران با شمارهٔ موبایل ثبت‌شده به‌عنوان ADMIN در سیستم و **نوع مشتری خاص** مرتبط است. تشخیص و مجوز فقط در سرور؛ شماره در فرونت hardcode نمی‌شود. نوع مشتری خاص با سطح دسترسی پنل مدیریت یکسان فرض نمی‌شود؛ schema واقعی **بررسی شود**. برای برنامه‌ریزی نیازی به دریافت خود شماره نیست.
- مشتری نهایی برای منو/سبد ورود عمومی دستگاه ندارد؛ طبق اصلاح 2026-11-23 موبایل معتبر مشتری در checkout الزامی و سفارش متعلق به مشتری است. OTP فقط برای تخفیف شخصی لازم است؛ پس از سفارش هویت موقت پاک/باطل و مجوز دستگاه حفظ می‌شود. checkout عادی دست‌نخورده می‌ماند.

## شواهد دقیق وضع موجود

ارجاع‌ها به فایل‌های فعلی worktree در زمان این تحلیل‌اند؛ بخش‌های نامرتبط dirty حفظ می‌شوند.

| منبع | واقعیت و اثر روی طراحی فنی |
|---|---|
| `AGENTS.md:1` و `CLAUDE.md:10` | این مخزن فقط فرونت مشتری است؛ API واقعی در این مخزن یا مخزن پنل نیست. تغییر وابسته به سرور باید هم‌زمان در `docs/BACKEND_CHANGES.md` با سرور/پنل/فرونت، مثال، fallback، جدول و تاریخچه ثبت شود. |
| `.codex/playbook.json:4`، `docs/codex-playbook.md:7` | خط `single` و برنامه `docs/task-plan.md`؛ انتخاب واقعی مدل با route است. |
| `pages/index.vue:30` | اکشن تم در هدر موجود است؛ نقطهٔ افزودن دکمهٔ جدید همین ردیف است. |
| `pages/index.vue:959`، `pages/index.vue:1011`، `pages/index.vue:1785`، `store/README.md:1` | سبد/کاتالوگ و `cartOpen` فعلاً در خود صفحه هستند؛ shared basket اجرایی موجود در store یافت نشد. `setProduct()` تعداد همهٔ محصولات را صفر می‌کند؛ mount مجدد نباید سبد مشترک را از بین ببرد. |
| `pages/index.vue:1668`، `pages/index.vue:1464`، `pages/index.vue:2337` | `GET /api/enduser/core/initialize` کاتالوگ می‌دهد؛ محصولات عادی با `categoryId` و حذف `specialDay` دسته‌بندی می‌شوند؛ غذای روز دستهٔ مجازی جدا دارد. |
| `pages/index.vue:1833`، `pages/index.vue:1867` | افزایش با `add_unit` و بررسی روز ویژه؛ کاهش guard صفر دارد ولی با واحد نامتجانس بالقوه منفی می‌شود. adapter باید رفتار معتبر را حفظ و ناهنجاری را در تست آشکار کند، نه پنهان اصلاح کند. |
| `pages/index.vue:1879`، `pages/index.vue:2394`، `pages/index/components/productItem.vue:55` | جمع محلی با قیمت خام، ارسال، مالیات گرد‌شده و تخفیف کد با سقف محاسبه می‌شود؛ کارت محصول درصد تخفیف محصول را نمایش می‌دهد و `selectedProducts` هم `total` و هم `totalWithDiscount` دارد. **ناهمخوانی موجود تخفیف محصول** باید در تسک حساس جدا تعیین تکلیف شود؛ صفحهٔ تازه موتور قیمت‌گذاری دوم نمی‌سازد. |
| `pages/index.vue:1535`، `pages/index.vue:1999` | `openCart()` و `order()` فعلی مهمان را به ورود هدایت می‌کنند؛ حذف عمومی این شرط‌ها حالت رستوران امن ایجاد نمی‌کند و checkout عادی را تغییر می‌دهد. |
| `pages/index.vue:2028`، `pages/index/components/billModal.vue:134` | preview در `POST /api/enduser/order/preview`؛ create در `/api/enduser/order/create` با خطوط `{product_id,count}`، تحویل، تخفیف، توضیح و آدرس؛ سپس redirect به `payment_link`. این قرارداد فعلی حالت ناشناس رستوران را اثبات نمی‌کند. |
| `utils/reorder.js:15`، `utils/reorder.js:37`، `pages/index.vue:1747` | reorder یک‌بار از `sessionStorage` مصرف، سبد را جایگزین و با ID یا fallback عنوان به کاتالوگ امروز وصل می‌کند؛ موجودی و آدرس نیز دخیل‌اند. mount صفحهٔ تازه نباید آن را دوباره مصرف کند. |
| `pages/index/components/registerModal.vue:362`، `:416`، `:450` | check-mobile، register و login فعلی؛ register/login توکن و user را در localStorage می‌نویسند. مسیر عادی را برای دستگاه مشترک دوباره استفاده نکنید. |
| `utils/customerSession.cjs:1`، `plugins/axios.js:47`، `:53` | token/user ذخیره‌شده قبل از mount و قبل از هر درخواست احیا و Authorization سراسری تنظیم می‌شود؛ خطر آمیختن هویت با درخواست دستگاه/مشتری گذرا. |
| `pages/index.vue:1481`، `utils/offers.js:80` | تخفیف شخصی فعلی از `/api/enduser/profile/active-discount-codes` با هویت واردشده می‌آید؛ seen کدها fallback دستگاهی localStorage دارد. آن fallback برای مشتری گذرا مناسب نیست. |
| `pages/index.vue:2143`، `plugins/auth.js:98` | خروج مشاهده‌شده محلی است؛ ابطال واقعی نشست سرور از این کد اثبات نمی‌شود. صرف پاک‌کردن localStorage شرط خروج دستگاه مشترک را تأمین نمی‌کند. |
| `pages/payment-result.vue:121`، `:141` | status callback فقط نمایش است و بازگشت پنج‌ثانیه‌ای دارد؛ query اثبات پرداخت یا پایان امن نشست نیست. |
| `dev-mock/mock-core.js:189`، `:247`، `:261` | mock ورود/preview دارد ولی create صریحاً 501 می‌دهد؛ نه احراز هویت واقعی، نه سفارش واقعی، نه revocation با آن اثبات می‌شود. |
| `assets/scss/_design-tokens.scss:24`، `:33`، `:107`، `:203`، `utils/motion.js:4`، `nuxt.config.js:48` | رنگ شرابی `#8A1318`، زعفرانی `#F0B323`، IRANSansX محلی، تم ذغالی و helper کاهش حرکت موجودند. `plugins/helper/currency.js:33` پیش‌فرض `$` دارد؛ نمایش تومان/ارقام فعلی را حفظ کنید، helper را کورکورانه استفاده نکنید. |

## معماری پیشنهادی قابل اجرا

### یک سبد، دو صفحه، checkout موجود

1. یک ماژول namespaced در `store/basket.js` با `state: () => (...)`، مجزا به‌ازای Nuxt app/request؛ بدون singleton سراسری سرور و بدون سبد دوم در صفحهٔ تصویری. دادهٔ دامنه: خطوط با کلید canonical محصول و تعداد؛ کاتالوگ فعلی؛ تنظیم محاسبه/تحویل و وضعیت quote. هویت، موبایل و PAN داخل basket یا persistence آن قرار نمی‌گیرند.
2. adapter مشترک، عملیات `initialize/reconcileCatalog`, `increment`, `decrement`, `replaceFromReorder`, selectors خطوط/تعداد/جمع و payload خطوط را ارائه می‌کند. نام فایل پیشنهادی `utils/basket.cjs` برای توابع خالص و تست Node؛ نام‌ها قرارداد پیشنهادی‌اند، فایل موجود نیستند. `pages/index.vue` و `/immersive-menu` از همان ماژول استفاده می‌کنند. init مجدد فقط metadata/قیمت/موجودی را reconcile می‌کند؛ تعداد معتبر را صفر نمی‌کند. سیاست محصول حذف‌شده/ناموجود با هشدار، بدون سفارش خاموش آن تست شود.
3. استخراج محاسبه ابتدا **هم‌ارزی رفتار فعلی** را با fixture اثبات می‌کند؛ تغییر معنای تخفیف محصول یا تومان/ریال جدا و پس از قرارداد سرور است. جمع نوار پایین از همان selector `bill.payment_amount` فعلی می‌آید و تا quote سرور «برآورد» است؛ create براساس قیمت ارسالی فرونت اعتماد نمی‌کند. با هر تغییر سبد/تحویل/هویت، quote قدیمی invalid می‌شود.
4. checkout معمولی فعلاً در `pages/index.vue` می‌ماند؛ اکشن سبد صفحهٔ تازه به `/` با intent یک‌بارمصرف در حافظهٔ store می‌رود و پس از init، همان `openCart()` را باز می‌کند. بدون خطوط، شماره، token یا آدرس در query؛ بدون کپی template/فرمول/ورود. بازگشت از سبد به صفحهٔ تصویری با back/return intent در حافظه و بدون گم‌شدن تعداد/دسته. این انتخاب کم‌تغییرتر از استخراج هم‌زمان کل checkout است.
5. حالت رستوران dispatch/checkout مجزا و server-authorized دارد؛ تا آماده‌شدن قرارداد آن، منوی تصویری برای مشتری عادی از همان checkout عادی استفاده می‌کند. خاموش‌بودن قابلیت جدید نباید ورود معمولی یا منوی اصلی را بشکند. در دستگاه مجاز رستوران، نبود API لازم به توقف سفارش ویژه با پیام روشن می‌انجامد؛ fallback به توکن حساب ADMIN ممنوع است.

### منوی تصویری و حالت‌های مرزی

- فایل پیشنهادی `pages/immersive-menu.vue` + اجزای کوچک `components/immersive-menu/`؛ CSS و اجزا صرفاً بعد از دروازهٔ تصویر. Nuxt 2/Vue 2 و Bootstrap فعلی حفظ؛ پکیج/کتابخانهٔ طراحی تازه لازم نیست.
- یک stage از لبه تا لبهٔ viewport پویا (`100dvh` با fallback)، عکس پشت تمام overlayها؛ **هیچ هدر، نوار بالای مات یا فضای رزروشدهٔ هدر ندارد**. لوگوی کوچک، دسته‌های فقط‌آیکن روی شیشهٔ محو و کنترل‌های پایین روی تصویر شناورند. safe-area فاصلهٔ کنترل‌هاست و عکس را کوتاه نمی‌کند. فقط محصول active؛ تصویر قبلی زیر بعدی نماند؛ swipe یا کنترل قبلی/بعدی دسترس‌پذیر، بدون auto-advance و بدون crossfade دو محصول. بازگشت به منوی اصلی می‌تواند یک کنترل شناور کم‌حجم با نام دسترس‌پذیر باشد؛ هدر اصلی فقط در صفحهٔ اصلی حفظ می‌شود.
- دستهٔ انتخاب‌شده از روی کنتراست/حالت آیکن مشخص باشد؛ نام فارسی برای screen reader و keyboard focus فراهم شود، نه متن دائمی کنار آیکن. blur شیشه بدون کاهش خوانایی؛ در نبود پشتیبانی blur یا کاهش شفافیت، fallback خوانای محدود به کنترل، نه هدر/پنل تمام‌عرض. لوگو و آیکن‌های تولیدی دارایی واقعی موجود/محلی‌اند؛ تصویر مفهومی Gemini جای دارایی برند یا عکس محصول را نمی‌گیرد.
- ترتیب flatten از دسته‌ها/کاتالوگ فعلی؛ food روز فقط یک‌بار در دستهٔ مجازی خود. tap دسته index اولین محصول همان دسته را تنظیم می‌کند؛ empty category حذف یا غیرفعال، active category با جابه‌جایی محصول sync. موجودی ناموجود و محدودیت روز قبل از افزودن کنترل می‌شود؛ رفتار special-day فعلی بدون تأیید تغییر نمی‌کند.
- منبع تصویر full `product.image` از همان baseURL و سپس thumbnail موجود؛ فقط عکس واقعی محصول. نبود/خطای عکس: stage خالی با نام/قیمت/کنترل سالم، نه عکس ساختگی، جایگزین غذای دیگر یا تصویر تولیدی Gemini. عکس نمونهٔ طرح در bundle تولیدی وارد نشود.
- پیشنهاد حرکت برای بازبینی: scale `1 → 1.04` در 18s، یک‌بار برای محصول active، توقف روی hidden/unmount؛ reduced-motion یعنی بدون زوم یا smooth jump. تصویر بعدی حداکثر محدود prefetch، نه بارگیری کل عکس‌ها؛ اندازهٔ stage ثابت برای جلوگیری از layout shift.
- همپوشانی صفر با safe-area، حداقل target 44px، RTL و خواندن درست قیمت/تعداد، focus قابل‌دیدن و live status کوتاه برای تغییر تعداد. خطای شبکه retry، کاتالوگ خالی، نام بلند و عکس خراب؛ light/dark، mobile browser chrome و keyboard داخل سبد بررسی شوند. آیکن تولیدی از فقط فایل‌های لازم `D:\soft\FontAwesome.Pro.7.3.1`؛ بستهٔ کامل یا assets دارای مجوز به Gemini ارسال/عمومی نشود.

## حالت رستوران: مرز امنیت و قرارداد **پیشنهادی** سرور

تحویل `IMMERSIVE-CONTRACT` در 2026-11-21: مرجع قرارداد قابل‌بازبینی، بند ۱۶
`../BACKEND_CHANGES.md` و حدود/شواهد در `contract-handoff.md` است. جدول زیر گزینه‌های اولیهٔ طرح است،
نه الزام ساخت همهٔ مسیرها؛ بند ۱۶ بازاستفادهٔ scoped از API فعلی auth/تخفیف/سفارش را پیشنهاد می‌کند.
نگاشت نهایی مسیر و schema همچنان به تأیید مالک backend نیاز دارد؛ تأیید تصاویر و readiness سرور بازند.

این بخش طراحی اولین نمونه است، نه ادعای endpoint واقعی. نام enum، schema مشتری، مجوز شمارهٔ ADMIN و همهٔ endpointهای جدید **بررسی شود**؛ API/پنل واقعی اینجا نیستند. کدهای نمونه opaque و غیرواقعی‌اند؛ هیچ شمارهٔ واقعی لازم یا ثبت نشده است.

**دو هویت مستقل:** مجوز دستگاه فقط اختیار سفارش رستوران دارد، نه پروفایل/تخفیف ADMIN یا پنل. طبق دستور 2026-11-23 موبایل معتبر مشتری الزامی و مالک سفارش مشتری است؛ OTP فقط برای تخفیف شخصی لازم است. واردکردن شماره به‌تنهایی مجوز خواندن حساب یا تخفیف نمی‌دهد. اتصال/ساخت مشتری واقعی وظیفه backend در مرج است.

| قرارداد پیشنهادی | نمونه و الزام |
|---|---|
| `POST /api/restaurant/device/challenges` و `POST /api/restaurant/device/verify` | بدنهٔ اول `{"mobile":"<authorized-mobile>"}`؛ سپس `{"challengeId":"opaque","code":"<otp>"}`. فقط server با special customer type معتبر، مجوز محدود می‌دهد؛ پاسخ challenge مستقل از وجود حساب، rate limit/expiry/replay guard. هیچ کد اضطراری برگشتی mock به‌عنوان راهکار تولیدی مجاز نیست. |
| `GET /api/restaurant/device/session` | `{"authorized":true,"capabilities":["restaurant-order"],"expiresAt":"<iso>","customerVerified":false}`؛ cookie دستگاه Secure/HttpOnly/SameSite با audience محدود و CSRF/origin validation. شناسهٔ enum واقعی و ورود اولیه را backend تأیید کند؛ شماره یا role حدسی در فرونت نباشد. |
| `POST /api/restaurant/customer/challenges` و `POST /api/restaurant/customer/verify` | موبایل الزامی فقط در body؛ verification برای تخفیف شخصی؛ جواب اول `{"challengeId":"opaque","expiresIn":120}` به‌صورت نمونهٔ پیشنهادی، نه TTL مصوب. verify با `{challengeId,code}` و cookie کوتاه‌عمر scoped به device/customer cycle؛ نه token/user عمومی، نه نام/پروفایل/PAN. TTL نهایی تصمیم backend/security است. |
| `GET /api/restaurant/customer/discount-codes` | قبل از verification مستقل `401/403` بدون کد شخصی/نام؛ بعد آن فقط تخفیف مجاز همان مشتری. `Cache-Control: no-store`؛ عدم cache در service worker/log/storage و عدم fallback seen دستگاهی. |
| `POST /api/restaurant/order/preview` | `{"products":[{"product_id":"<public-product-key>","count":1}],"discount_code":null,"table_ref":null}`؛ `table_ref` فقط placeholder قرارداد تا تعیین سیاست میز، نه الزام محصول. پاسخ پیشنهادی `{"quote_id":"opaque","catalog_version":"opaque","total_amount":600000,"tax_amount":0,"discount_amount":0,"payment_amount":600000,"expires_at":"<iso>"}`. اعداد فقط fixture عمومی طرح‌اند؛ مالیات/سرویس واقعی را سرور تعیین می‌کند. |
| `POST /api/restaurant/order/create` | `{"quote_id":"opaque","catalog_version":"opaque","products":[{"product_id":"<public-product-key>","count":1}],"discount_code":null}` با header `Idempotency-Key: <opaque>`؛ انتخاب قطعی آنلاین/کارت از adapter بند۱۹ نگاشت شود؛ enum تولیدی بررسی شود. سرور device entitlement، اتصال الزامی مشتری، موجودی، واحد، قیمت و eligibility را دوباره بررسی و quote قدیمی را رد کند. پاسخ نمونه `{"order_ref":"opaque","state":"placed","customer_session_revoked":true}`؛ state واقعی و معنای ثبت/پرداخت هنوز تأیید نشده‌اند. |
| `DELETE /api/restaurant/customer/session` | ابطال idempotent با `204` برای لغو/timeout/تغییر مشتری؛ cookie پاک شود، server epoch/nonce عوض و credential قبلی رد شود. endpoint پایان‌دادن مجوز دستگاه جداست و سیاست آن باید تعیین شود. |
| `GET /api/restaurant/order-attempts/{opaque}` | بازیابی محدود نتیجهٔ تلاش پس از timeout، فقط با مجوز دستگاه و idempotency linkage؛ بدون دسترسی به پروفایل/تخفیف/موبایل مشتری قبلی. قرارداد پیشنهادی برای جلوگیری از سفارش تکراری، نه API موجود. |

### پایان سفارش و دستگاه مشترک

- هنگام فعال‌شدن حالت مجاز، client API مجزا و allowlist endpoint با scope دستگاه؛ **از instance سراسری دارای interceptor احیای token استفاده نشود**. mode پیش از bootstrap/restoration تعیین شود؛ direct route، reload و `/profile` نیز نتوانند هویت عادی را روی دستگاه مشترک دوباره احیا کنند. نشست عادی خارج از mode تغییر نکند؛ مهاجرت وضعیت قبلی فقط در مرز فعال‌سازی صریح و تست‌شده.
- هویت موقت در localStorage، sessionStorage، URL، persisted Vuex، analytics، log، screenshot یا cache قرار نگیرد. فقط حافظهٔ گذرا و cookie محافظت‌شدهٔ server؛ هیچ profile/PAN/history/address/message poll یا endpoint enduser شخصی برای device مجاز نشود. داده‌های قدیمی reorder/seen/notification نیز نباید به مشتری بعد منتقل شوند.
- سرور در همان تراکنش ثبت موفق سفارش، سفارش را به مشتری تأییدشده وصل و session او را revoke می‌کند؛ مجوز دستگاه باقی می‌ماند. frontend همهٔ داده‌های مشتری، تخفیف/quote وابسته، OTP، فرم و timers را پاک و request epoch را عوض می‌کند؛ پاسخ دیررس A پس از شروع مشتری B کنار گذاشته شود. سبد بعد از ثبت قطعی برای سفارش بعدی خالی می‌شود.
- خطا/timeout به‌معنی ثبت نشدن نیست: submit تکراری بدون idempotency ممنوع؛ تا reconciliation فقط receipt/attempt محدود و غیرشخصی؛ اطلاعات شخصی فوراً مخفی شود و cleanup سمت سرور تا revoke/TTL تضمین شود. expiry/leave/cancel نیز session و دادهٔ شخصی را پاک کنند؛ بستن tab به‌تنهایی ضمانت revoke نیست.
- زمان دقیق «بعد از سفارش» با پرداخت آنلاین روشن شود: پیشنهاد امنیتی revoke هویت در ثبت قطعی سفارش، قبل از gateway، با receipt capability محدود و تأیید پرداخت در سرور. موفقیت query یا بازگشت ۵ثانیه‌ای فعلی جای این قرارداد نیست. صدور سفارش/پرداخت ناشناس قبل از آماده‌بودن backend فعال نشود.

## کار مستقل قبل از تأیید تصویر

**سابقهٔ زمان تحویل SPEC:** آن تحویل صرفاً برنامه بود و اجرای کد بعدی به packet/claim نیاز داشت. محدودیت انتظار برای تصویر اکنون با تأیید مرجع واحد بالا رفع شده است.

حداقل fixtureهای adapter: `add_unit` غیر۱، صفر/کاهش، special-day، ناموجود/حذف‌شده، init دوباره با حفظ تعداد، reorder یک‌بار با تغییر قیمت امروز، مالیات و سقف تخفیف و ارسال، line totals/کل سبد، دو مصرف‌کننده از یک state و عدم اشتراک بین دو app/request. تست‌ها رفتار واقعی/قرارداد را بسنجد، نه صرفاً بازنویسی فرمول جدید. تغییر مالی نیازمند critical routing است. contract tests امنیتی با test double جدا و همهٔ محدودیت‌های mock صریح ثبت شود؛ قبولی آنها اثبات backend نیست.

## تسک‌ها، وابستگی و پذیرش

برنامهٔ اجرایی در `../task-plan.md` ثبت می‌شود. نوع/مدل جدول زیر مقصد route است؛ قبل از claim هر تسک `critical`، هماهنگ‌کننده باید زیر قفل مجاز `.codex/playbook.json` مقدار پایدار `task_overrides.<id>.critical=true` ثبت و route را دوباره اجرا کند. این تسک اجازهٔ تغییر config ندارد؛ صرف `route --critical` یا متن مدل در جدول مجوز اجرا نیست.

| شناسه | نوع / مدل هدف | وابستگی و پذیرش |
|---|---|---|
| IMMERSIVE-SPEC | S / Sol high | این تحویل؛ منابع، تصمیم‌های باز، prompt و gateها ثبت. |
| IMMERSIVE-GEMINI | D / **Gemini صریح کاربر** | SPEC + اصلاح REV2؛ دو طرح جدید استوری بدون هدر، دسته‌های فقط‌آیکن شیشه‌ای و لوگوی شناور؛ تولید در همان گفت‌وگو گزارش شده، مسیر خروجی جدید منتظر دریافت. تصاویر قبلی superseded و تأییدنشده؛ native model جایگزین نشود. |
| IMMERSIVE-IMAGE-APPROVAL | کاربر | GEMINI؛ فقط دو فایل جدید REV2 روشن/تاریک با مسیر نهایی برای تأیید/اصلاح؛ بدون تأیید، UI blocked. |
| IMMERSIVE-DECISIONS | کاربر + backend owner | SPEC؛ schema/entitlement نوع خاص، پرداخت، میز و پایان نشست تعیین شود؛ خود شمارهٔ ADMIN لازم نیست. مستقل از gate تصویر. |
| IMMERSIVE-CONTRACT | A / **Sol xhigh، critical** | SPEC؛ پیش از تصویر آمادهٔ بررسی: قرارداد special type/device/customer/anonymous order/revoke + قیمت/تخفیف؛ در BACKEND_CHANGES با جدول، مثال و fallback و نام فایل پنل فقط پس از بررسی واقعی. schema/API مالک بیرونی را approved فرض نکند. |
| IMMERSIVE-CART-CORE | T2 / **Sol xhigh، critical** | SPEC؛ مستقل از تصاویر/تصمیم رستوران: characterization، adapter خالص/تست بدون wiring UI، هم‌ارزی محاسبه و capture اختلاف تخفیف؛ بدون اصلاح مالی حدسی. |
| IMMERSIVE-CART-WIRE | B2 / **Sol xhigh، critical** | CART-CORE + IMAGE-APPROVAL؛ store واحد و اتصال منوی اصلی/intent checkout؛ بدون drift، reset mount یا تکرار reorder؛ regression عادی. |
| IMMERSIVE-UI | B / Terra medium | CART-WIRE + IMAGE-APPROVAL؛ دکمهٔ ورود کنار تم در منوی اصلی؛ صفحهٔ استوری بدون هدر، عکس تمام viewport پشت کنترل‌ها، آیکن‌های شیشه‌ای شناور، لوگوی واقعی کوچک و price/stepper/cart خوانای پایین طبق REV2 تأییدشده؛ بدون تغییر auth. |
| IMMERSIVE-RESTAURANT-READY | backend owner / کاربر | CONTRACT + DECISIONS؛ schema و API واقعی، device/customer isolation، verification، order/idempotency/revocation با شواهد محیط آزمون؛ mock 501 یا وعدهٔ backend به‌معنی done نیست. |
| IMMERSIVE-RESTAURANT | B2 / **Sol xhigh، critical** | UI + CONTRACT + RESTAURANT-READY + DECISIONS؛ ورود مجاز دستگاه، موبایل الزامی/مالک مشتری، تخفیف تأییدشده، سفارش و cleanup اتمیک؛ checkout عادی ثابت. |
| IMMERSIVE-SECURITY-Q | Q / **Sol xhigh، critical** | RESTAURANT + CART-WIRE؛ account enumeration، replay، CSRF، credential scope، دیررس A/B، refresh/back/tab/cache، ابطال server و double-submit؛ با backend واقعی، نه فقط interception. |
| IMMERSIVE-UX-Q | Q / Sol medium | UI؛ 390×844 هر دو تم، عکس edge-to-edge پشت کنترل‌ها/بدون هدر، لوگو و دستهٔ فقط‌آیکن شیشه‌ای، یک محصول/بدون overlap، safe-area، نام دسترس‌پذیر، category first product، long copy/missing photo، reduced motion، رفت‌وبرگشت دو منو/سبد و checkout معمولی. |
| IMMERSIVE-DELIVERY | G / Terra high | SECURITY-Q + UX-Q؛ مدرک تست و قرارداد، مالک backend و محدودیت‌ها، تأیید طرح و فایل‌های دقیق؛ بدون انتشار ویژگی ناقص حالت رستوران. |

## تصمیم‌های باز و نقاط دیباگ دشوار

1. **Schema/activation:** enum یا field نوع مشتری خاص، endpoint فعلی احراز آن، نقش دقیق شمارهٔ ADMIN، ورود اولیه/عمر/ابطال device authorization چیست؟ آیا دستگاه شخصی ADMIN است یا ترمینال مشترک؟ هیچ شماره یا role حدسی درج نشود.
2. **پرداخت:** انتخاب کاربر قطعی است: آنلاین و «کارت میکشم». تأیید کارت درخواست مشتری است؛ attestation، نگاشت enum/مبلغ و ثبت/لغو سروری TODO مسئول مرج بند۱۹ است، نه مانع تکمیل فرونت. فیلد یا مرحلهٔ میز به جریان اضافه نشده است.
3. **مشتری:** موبایل معتبر الزامی و مالک سفارش مشتری است. OTP عمومی سفارش اجباری نیست؛ تخفیف شخصی فقط پس از تأیید صحیح. اتصال حساب واقعی با شماره، scope و نگهداری سروری TODO مرج است؛ ورود عمومی دستگاه ساخته نمی‌شود.
4. **تخفیف محصول:** آیا قیمت API قبل/بعد درصد است؟ ترتیب tax/shipping/code cap و تومان/ریال را سرور مشخص کند. آزمون adapter باید اختلاف فعلی UI/total را آشکار سازد؛ رسیدن mock به عدد یکسان اثبات صحت مالی نیست.
5. **Navigation/init:** خروج از index آن را unmount و بازگشت `setProduct` را اجرا می‌کند؛ تست رفت‌وبرگشت قبل از افزودن UI ضروری است. intent باید فقط یک‌بار مصرف و پاسخ init دیررس نتواند تعداد را پاک کند.
6. **Auth resurrection:** حتی صفحهٔ بدون login می‌تواند با interceptor سراسری توکن قدیمی بفرستد؛ تست network headers برای هر دو client و direct-load ضروری است. cookie HttpOnly به‌تنهایی بدون server scope/CSRF/revocation کافی نیست.
7. **ترتیب cleanup:** callback پرداخت، timeout create و دیررس discount نباید هویت مشتری قبلی را بازگرداند؛ state machine و server reconciliation جزء acceptance هستند، نه فقط پاک‌کردن فرم.

## شواهد تحویل و حدود

سابقهٔ تحویل SPEC: بررسی ساختار سند و ارجاع‌ها موفق بود و آزمون runtime در آن تسک انجام نشد. وضعیت قدیمیِ انتظار برای خروجی و تأیید تصاویر منسوخ است؛ تصویر واحد بالای سند تأیید شده است. آمادگی backend واقعی همچنان مستقل و باز است.
