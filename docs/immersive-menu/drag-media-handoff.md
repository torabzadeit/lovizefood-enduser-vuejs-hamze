# تحویل IMMERSIVE-DRAG-MEDIA — 2026-11-21

STATUS: DONE. ریشه `D:\lovizefood`، خط single، claim `7b91db12-428e-477c-b078-083165e3a49e`. skill منتخب همین مرحله **emilkowalski-motion** است؛ طراحی بصری قبلی حفظ شد. بدون commit/push، restart، dependency یا build کامل جدید.

## تغییرات

- `pages/immersive-menu.vue`: drag به راست، محصول بعدی را از چپ می‌آورد؛ drag به چپ قبلی را می‌آورد. دکمهٔ سمت چپ و ArrowLeft همچنان next هستند و SVG جهت صریح دارد. تصویر و کارت اطلاعات با pointer جابه‌جا می‌شوند، ولی لوگو/دسته/سبد ثابت‌اند. preview گذرای incoming غیرتعاملی و aria-hidden است؛ در استراحت فقط یک محصول فعال باقی می‌ماند. settle/cancel با transform و easing واحد 180ms، مقاومت در مرزها، آستانهٔ 50px، pointer capture/cancel، مهار ghost click و جلوگیری از commit دوباره اجرا می‌شود. reduced motion، settle خودکار را فوری می‌کند و حرکت مستقیم دست همچنان دنبال می‌شود.
- `.local-dev/StoryVideo.vue` و `.local-dev/story-demo.js` ignored: نمونه‌های موجود و صریح محلی در صف پس از bootstrap درخواست می‌شوند، مستقل از فعال‌بودن محصول. صف حداکثر دو نمونه و یک شروع بارگذاری هم‌زمان دارد؛ فعلاً فقط **یک نمونه** تنظیم شده است. فعال‌سازی دوباره، عنصر ویدئو را بازسازی یا src را دوباره تنظیم نمی‌کند. autoplay فقط muted/playsinline است؛ grid، hidden، offscreen و reduced motion مانع پخش‌اند.
- poster از همان فیلم Pexels موجود با canvas محلی استخراج و در `.local-dev/media/shawarma-poster.jpg` ذخیره شد (126,260 bytes). این poster فقط fixture همان محصول اول است؛ اگر عکس واقعی موجود باشد، روی آن قرار نمی‌گیرد. تا نخستین frame decodeشده، photo/poster باقی می‌ماند؛ سپس ویدئو با fade 180ms نمایان می‌شود. canplay/buffering/error و منع autoplay fallback را حفظ می‌کنند. تصویر یا ویدئوی نمونه به سایر غذاها تعمیم داده نشده است.
- **قرارداد ویدئوی backend فعلاً وجود ندارد.** این پیاده‌سازی صرفاً fixture/config محلی را مصرف می‌کند و ادعای آمادگی ویدئوی محصولات واقعی ندارد؛ فیلد جدید، auth یا محاسبهٔ مالی ایجاد نشده است.
- `test/immersive-explore.browser.cjs` جهت drag قبلی و انتظار برای settle را به‌روز می‌کند؛ matrix کامل قبلی دوباره اجرا نشد.

## شواهد محدود

`test/immersive-drag-media.browser.cjs` موفق در **587×781 با mouse واقعی** و **390×844 با touch از CDP**:

- جابه‌جایی هم‌زمان تصویر/کارت در میانهٔ gesture: **235px/235px** و **156px/156px**؛ incoming سمت چپ و سبد بدون جابه‌جایی.
- جهت بعدی/قبلی، drag کوتاه و cancel، مرز ابتدا/انتها، دکمه و keyboard، reduced motion، grid و حفظ counts موفق؛ pageerror صفر.
- پاسخ ویدئو عمداً معطل شد: poster قابل‌نمایش و opacity ویدئو صفر بود؛ پس از آزادسازی پاسخ، نخستین frame و playback واقعی نمایان شد. درخواست رسانه در رفت‌وبرگشت محصولات فقط **یک بار** ثبت شد.
- شروع کاتالوگ روی محصول غیر ویدئویی: درخواست background نمونه پیش از فعال‌سازی ثبت شد. خطای شبکهٔ عمدی، poster را پس از انتخاب نمونه نگه داشت.
- regression loop طبیعی player جدید: **12.5079s → 0.0281s**، مدت **12.52s**، بدون seek آزمایشی.

تصاویر بازبینی‌شده: `.local-dev/media-pending-{587,390}.png` و `.local-dev/drag-progress-{587,390}.png`؛ poster از فیلم نمونهٔ محلی است. عکس مفقود محصولات واقعی/سایر محصولات همچنان خالی است.

اصلاحات کشف‌شده در آزمون: flag قدیمی drag نباید click مستقل بعدی را ببلعد؛ disable موقت arrow نباید focus را از بین ببرد. هر دو رفع و در اجرای موفق بعدی تأیید شدند. تغییرات نامرتبط حفظ شدند؛ مالکیت همین تسک در پایان آزاد می‌شود.
