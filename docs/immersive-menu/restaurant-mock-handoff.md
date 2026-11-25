# تحویل مستقل IMMERSIVE-RESTAURANT-MOCK — 2026-11-22

> تکمیل درخواست جدید همان روز در [kiosk-followup-handoff.md](kiosk-followup-handoff.md) است:
> back/logout منوی رستوران حذف و بررسی tablet/mobile و جداسازی دستگاه تکمیل شد. توضیح خروج بالای
> منو و نگهداری claim در ادامهٔ این سند، سابقهٔ تحویل قبلی است؛ وضعیت جاری را از سند تکمیل بخوانید.

- worker واگذارشده با route صریح `gpt-6.1-sol/xhigh`؛ بدون زیرعامل/بررسی مستقل. claim مشتری
  `abd085bb-2c5d-48b9-925e-87d10984de8f` و تمام قفل‌های هر دو root برای coordinator حفظ شدند.
- ورود آزمایشی از فرم موجود `/`: شماره **09000000001**، کد **12345**؛ دریافت check-mobile و سپس login
  الزامی است. هیچ شمارهٔ واقعی استفاده نشد. نشست هشت‌ساعتهٔ حافظه‌ای است؛ خروج بالای منو سرور را revoke می‌کند.
- `/restaurant-mock` فقط در توسعهٔ loopback، پس از GET scope از mock واقعیِ Node باز می‌شود؛ persisted
  user flags کافی نیست. همان UI تأییدشدهٔ immersive با `restaurantMockBasket` مستقل استفاده می‌شود.
- سبد و ثبت اختصاصی با preview/create سروری mock، `delivery_type:inRestaurant`، idempotency، قیمت
  کاتالوگ و بدون پرداخت. عادی/جعلی/منقضی/باطل‌شده رد می‌شود؛ guest phone/discount/payments جزو این اثبات نیست.
- فایل پیش‌فرض `.local-dev/restaurant-mock/orders.json` مشترک است؛ admin sibling از آن فقط می‌خواند و
  همان شناسه در فهرست/جزئیات/سابقه دارد. متغیر توسعهٔ `LOVIZE_RESTAURANT_MOCK_RECORD` برای مسیر دیگر
  در هر دو فرایند یکسان باشد. فایل token ندارد؛ status admin فقط حافظه‌ای و یک‌طرفه است.
- `node --test test/restaurant-mock.test.cjs`: **7/7 PASS**؛ شامل دو HTTP server با پورت‌های آزاد و فایل
  موقت مستقل. ۱۲ آزمون basket و ۶ آزمون store و آزمون profile-review قبلی نیز PASS شدند؛ کامپایل template
  سه فایل منو، route و checkout بدون خطا بود. worker ورود مستقیمِ بدون نشست را در مرورگر تازه بررسی کرد:
  `/restaurant-mock` به `/` برگشت؛ plugin موجود و خطای page برابر صفر بود.
- coordinator در پیام همین نشست، آزمون مرورگر روی `3333/3003` و `8094/3008` را PASS گزارش کرد:
  OTP از UI، هدایت به مسیر اختصاصی، افزودن غذا، submit و مشاهدهٔ سفارش `inRestaurant` در admin API.
- فرایند جاری admin `8093/3007` و customer `3333/3003` restart نشدند. هر دو launcher جدید با API
  `127.0.0.1` هماهنگ‌اند؛ mock API جدید فقط روی این loopback bind می‌شود. برای دیدن import مشترک، admin
  mock قدیمی در فرصت انتخابی coordinator با منبع جدید اجرا شود؛ coordinator پیش‌نمایش جداگانهٔ جدید
  `8094/3008` را برای بررسی مشترک اجرا کرده است.
- بند **۱۸** `docs/BACKEND_CHANGES.md` شامل schema، مثال، fallback، مرز integration و تاریخچه است؛
  `IMMERSIVE-RESTAURANT-READY` و `IMMERSIVE-RESTAURANT` واقعی و تصمیم‌های بند ۱۶ دست‌نخورده‌اند.
- هر دو مخزن از ابتدا dirty بودند؛ هیچ stage/commit/reset انجام نشد. task row را worker نهایی نکرد؛
  وضعیت/تأیید نهایی با coordinator است.
