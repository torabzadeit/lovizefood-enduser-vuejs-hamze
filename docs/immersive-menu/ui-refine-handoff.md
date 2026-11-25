# تحویل IMMERSIVE-UI-REFINE — 2026-11-21

STATUS: DONE. ریشه `D:\lovizefood`، خط `single`، claim همین تسک `b785b35f-f041-45b2-929e-36a90071b042`. بدون commit/push، وابستگی جدید یا restart سرور 3333.

- `pages/immersive-menu.vue`: چیدمان داخلی stepper اکنون LTR است تا + چپ و − راست باشد؛ semantics و عملیات store حفظ شدند. پیکان سبد همان SVG واقعی arrow-left است و به bidi وابسته نیست. صورت دستهٔ فعال کرم روشن، حاشیهٔ ظریف و glow پخش‌شدهٔ طلایی دارد؛ حلقهٔ سخت 4px حذف شد. انتخاب طراحی قبلی با دستور هماهنگ‌کننده پس از مهلت پاسخ حفظ شد.
- `.local-dev/Drawer.vue` (ignored): trigger برای درخواست «فعلاً مخفی» به‌طور سراسری پنهان است؛ به `$route` مستقل و قدیمی تکیه نمی‌کند. سایر رفتارهای ابزار محلی حفظ شدند.
- `.local-dev/plugin.js`, `.local-dev/StoryVideo.vue`, `.local-dev/story-demo.js` و `.local-dev/media/shawarma-demo.mp4` همگی ignored هستند. plugin توسعهٔ موجود، پخش‌کننده را داخل photo stage نصب و در خروج destroy می‌کند؛ فقط محصول اولِ تنظیم‌شده با کلید `4e42e4c2-3e27-4e98-9244-9e268c30132a` نمونه دارد. تغییر محصول، پنهان‌شدن سند، خارج‌شدن از دید یا reduced motion پخش را متوقف می‌کند. خطا/منع autoplay، fallback تصویری موجود را باقی می‌گذارد. هیچ فیلد backend یا ویدئوی واقعیِ منتسب به رستوران ساخته نشده است.

منبع نمونه: [Juicy Shawarma Rotating on Vertical Spit، Yasin Onuş](https://www.pexels.com/video/juicy-shawarma-rotating-on-vertical-spit-37329596/)، [مجوز Pexels](https://www.pexels.com/license/). این منبع اینترنتی انتخاب‌شده طبق درخواست کاربر، ۱۲ثانیه‌ای است و با encoder موقت به H.264، 540×960، بدون audio و با faststart تبدیل شد؛ خروجی **1,057,619 bytes** است و در سورس تولیدی وارد نشده است.

آزمون `test/immersive-refine.browser.cjs` در **587×781** و **390×844** موفق: `readyState=4`، `videoWidth=540` و پیشروی واقعی `currentTime`؛ muted/playsinline/loop، توقف hidden/reduced-motion/تغییر محصول، نابودی player پس از خروج؛ + چپ و − راست با تغییر صحیح مقدار، پیکان SVG بدون mirror، trigger مخفی در صفحهٔ استوری و اصلی، بدون pageerror یا order create. آزمون محدود همین اصلاحات است؛ build کامل موفق مرحلهٔ UI بدون تکرار غیرضروری حفظ شد.

تصویر واقعی اجرای محلی: `D:/lovizefood/.local-dev/immersive-video-587.png`. فایل‌های محلی و ویدئو با `git check-ignore` بررسی می‌شوند؛ تغییرات نامرتبط حفظ شده‌اند. قفل‌ها و claim فقط همین تسک پس از تحویل آزاد می‌شوند.
