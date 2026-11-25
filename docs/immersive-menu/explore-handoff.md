# تحویل IMMERSIVE-EXPLORE — 2026-11-21

STATUS: DONE. ریشه `D:\lovizefood`، خط single، claim `9521ac40-3dba-4f92-8e12-bc067cb7d801`؛ design-taste-frontend انتخاب صریح کاربر است. بدون وابستگی، restart، commit/push یا تغییر مالی/auth/backend.

`pages/immersive-menu.vue`: عنوان footer دقیقاً «جمع مبلغ»، دکمهٔ افزودن زرشکی با متن سفید، سایهٔ سیاه پخش پشت لوگو؛ gesture واحد Pointer Events برای touch و mouse با capture، آستانهٔ 50px، لغو و مهار click پس از drag. rail اکنون 32px فضای عمودی و 36px حاشیهٔ افقی برای glow دارد؛ موقعیت عمودی خود دکمه‌ها حفظ شده و auto-scroll حاشیهٔ glow را نگه می‌دارد.

دکمهٔ grid-2 نخستین مورد rail است. Explore یک overlay تمام‌صفحه با scroll مستقل و دقیقاً سه ستون در هر دو عرض است؛ دکمهٔ بازگشت sticky، Esc، مدیریت focus/Tab و غیرفعال‌شدن محتوای پشت overlay دارد. فقط عکس/قیمت دیده می‌شود و نام محصول در accessible label است. ترتیب، metadata و قیمت نمایشی موجود از store خوانده می‌شود؛ انتخاب tile همان محصول story را فعال می‌کند، بدون checkout یا تغییر counts. Arrow keys در explore محصول مخفی را جابه‌جا نمی‌کنند.

`components/immersive-menu/ExplorePhoto.vue`، thumbnail را نزدیک viewport به‌صورت lazy بررسی می‌کند؛ فقط header پاسخ بررسی و body لغو می‌شود، نه دریافت blob کامل همهٔ محصولات. SVG شناخته‌شده و عکس خراب خالی می‌مانند؛ raster واقعی و fallback میزبان فاقد CORS مطابق قاعدهٔ قبلی قابل نمایش‌اند. هیچ نمونهٔ ویدئو به‌عنوان عکس همهٔ غذاها استفاده نشده است.

`.local-dev/StoryVideo.vue` و `.local-dev/plugin.js` همچنان ignored هستند. ویدئو در explore متوقف می‌شود؛ loop property و fallback ended حفظ شدند. علت توقف متناوب time=0 در آزمون مشخص شد: observer روی عنصر video می‌توانست پس از mount/HMR در حالت offscreen قدیمی بماند. اکنون stage پایدار مشاهده و هندسه هنگام فعال‌شدن تازه می‌شود؛ اتصال plugin نیز host قدیمی را پس از HMR نگه نمی‌دارد.

## شواهد محدود همین تغییر

- `test/immersive-explore.browser.cjs`: **587×781 و 390×844، روشن و تاریک PASS**؛ drag واقعی mouse چپ/راست، drag کوتاه/لغوشده، footer/رنگ/لوگو، حاشیهٔ halo، grid سه‌ستونی و scroll مستقل، tile دقیق و حفظ counts، back/Esc و مهار ArrowLeft در explore، pause ویدئو و reduced motion، عکس خراب و SVG mock خالی؛ بدون pageerror و order create.
- loop طبیعی بدون seek: مدت **12.52s**؛ رسیدن به **12.4966s** و سپس **0.0102s** ثبت شد. دور کامل پیش از اصلاح visibility نیز ثبت شده بود؛ اصلاح visibility با چهار ورود تازهٔ matrix تأیید شد.
- تصاویر واقعی بازبینی شدند: `.local-dev/story-explore-587.png` و `.local-dev/explore-{587,390}-{light,dark}.png`. grid در این محیط عمداً blank است چون عکس‌های mock SVG هستند؛ ساختار سه‌ستونی، قیمت و back دیده می‌شوند.
- آزمون‌های اولیهٔ fixture با تغییر مستقیم Vuex به guard برخورد کردند؛ fixture نهایی از mutation موجود `basket/loaded` استفاده می‌کند و موفق است. build تولیدی کامل قبلی حفظ شد؛ طبق درخواست این مرحله تکرار نشد.

فایل‌های نامرتبط حفظ شدند. قفل‌ها و claim همین task در مرز تحویل آزاد می‌شوند.
