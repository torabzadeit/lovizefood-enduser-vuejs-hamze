STATUS: DONE — IMMERSIVE-SIDEBAR-GUTTER، 2026-11-21.

`pages/immersive-menu.vue`: کارت اصلی و incoming با right=104px کنار rail راست قرار می‌گیرند؛ فاصلهٔ واقعی 8px است. rail تا 12px بالای cart ادامه دارد؛ ResizeObserver و محاسبهٔ ارتفاع کارت حذف شد. flex-wrap کنترل‌های قیمت/تعداد از overflow جلوگیری می‌کند. متن add و preview دقیقاً «افزودن» است؛ علامت‌های stepper حفظ شدند. فقط `.story__top .story__back img` به راست چرخیده و پیکان cart/next عوض نشده‌اند.

بررسی محدود واقعی 563×781 و 390×781 موفق: gap=8، railBottom=702، cartTop=714، بدون overflow، عرض یکسان incoming، متن add، scroll دستهٔ آخر و تغییر count. جهت top ماتریس rotate180 و cart transform=none تأیید شد. تلاش اول 390 در انتظار رویداد load timeout شد؛ اجرای مجدد با domcontentloaded موفق بود. تصاویر: `.local-dev/gutter-563.png` و `.local-dev/gutter-390.png`.

بدون backend، dependency، build، commit/push یا دست‌کاری runtime/session34205. claim `649fd819-f003-444c-94c9-c114ad1350d5` و قفل‌های خود تسک پس از تحویل آزاد می‌شوند.
