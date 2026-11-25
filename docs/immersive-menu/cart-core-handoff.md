# تحویل IMMERSIVE-CART-CORE — 2026-11-21

STATUS: DONE — adapter و آزمون اجرایی؛ آمادهٔ اتصال در WIRE، بدون اتصال UI در CORE.

ریشه `D:\lovizefood`، خط `single`، sole writer؛ claim انتقالی
`b1a8a138-5455-4dcb-b790-52cb00815e52` تطبیق داده شد. route و override پایدار:
`gpt-6.1-sol/xhigh`، critical. بدون زیرعامل، commit/push یا تغییر runtime.

## API مشترک آمادهٔ استفاده

`require('~/utils/basket.cjs')`؛ همهٔ عملیات pure و بدون mutation هستند؛ نتیجه را جایگزین state کنید.
شکل state: `{ products, counts, issues }`؛ `products` فقط metadata مجاز کاتالوگ، کلید canonical رشته‌ای؛
`counts` یک map بدون prototype از کلید به تعداد، `issues` فقط `{key,reason}` آخرین عملیات است.
یک `createBasket()` مستقل برای هر app/request؛ singleton یا persistence ایجاد نشده است.

| export | ورودی / نتیجه |
|---|---|
| `createBasket(products = [])` | state تازه؛ بدون حساب/موبایل/PAN/آدرس/تخفیف شخصی |
| `reconcileCatalog(state, products)` | کاتالوگ تازه، حفظ تعداد؛ حذف/ناموجودشدن انتخاب با `removed`/`out-of-stock` و تعداد صفر؛ تغییر واحد `unit-changed` بدون گردکردن تعداد قبلی |
| `setCount(state, key, count, options = {})` | تعداد عددی معتبر؛ صفر برای `removeProduct`؛ ورودی نامعتبر با issue، بدون تغییر تعداد |
| `increment(state, key, { steps = 1, dayIndex } = {})` | افزایش به‌اندازهٔ واحد کاتالوگ × تعداد گام صحیح مثبت؛ guard موجودی/روز ویژه |
| `decrement(state, key, { steps = 1 } = {})` | کاهش با همان واحد، بدون عبور از صفر؛ روز غیرمجاز مانع کاهش نیست |
| `replaceFromReorder(state, lines, options = {})` | فقط `takeReorder().lines`؛ جایگزینی کامل، جمع خطوط تکراری، ID و سپس fallback عنوان، قیمت امروز؛ null بدون تغییر؛ تکرار ورودی تعداد را دوبرابر نمی‌کند |
| `selectedProducts(state)` | همان شکل خط فعلی index: `key,name,count,price,unit_name,discount_percent,total,totalWithDiscount` |
| `orderProducts(state)` | فقط `{product_id,count}`؛ بدون هویت/آدرس/قیمت ارسالی |
| `calculateBill(state, options = {})` | همان `bill` فعلی: `total_amount,discount_amount,tax_amount,shipping_amount,payment_amount`؛ options گذرا با نام‌های فعلی `delivery_type,shippingCost,taxEnabled,taxPercent,discountCode` |

`discountCode` محاسباتی فقط `{code_valid_status,discount_percent,max_amount}` لازم دارد؛ آن را در state
مشترک ذخیره نکنید. `dayIndex` عدد ۰=شنبه … ۶=جمعه است؛ تاریخ انتخاب‌نشده یعنی بدون آن؛ state تاریخ
یا آدرس نگه نمی‌دارد. کنترل نهایی روز/حداقل سفارش موجود در `order()` باید در WIRE حفظ شود.
کلیدهای عددی/string یکسان می‌شوند؛ duplicate اولین مقدار معتبر را حفظ و issue می‌دهد. کاتالوگ
نامعتبر را به‌عنوان پاسخ موفق بارگذاری نکنید؛ خطای شبکه نباید `reconcileCatalog(state, [])` شود.

## نکات اتصال فوری WIRE

- ماژول Vuex با state factory؛ هر دو صفحه همان state را بخوانند. عملیات باید state تازه را جایگزین
  کنند؛ `productData` فعلی را در getter از `products` و `counts[key]` بسازید و همان ساخت URL عکسِ
  `setProduct()` را نگه دارید. افزودن هر export/framework اضافی در CORE لازم نشده است.
- `setProduct()` فعلی در mount تعداد را صفر می‌کند؛ به reconcile تبدیل شود، نه create دوباره.
  همهٔ مسیرهای تغییر count، از جمله chef tab و remove، از adapter عبور کنند؛ هیچ سبد دوم نسازید.
- `takeReorder()` فعلی همچنان یک‌بار storage را می‌خواند/پاک می‌کند؛ تنها `pending.lines` وارد adapter
  شود. `deliveryType/deliveryAddress` فقط در checkout عادی باقی بمانند. `addressOverridden`،
  `selectedAddressId`، آدرس پیش‌فرض و guard انتخاب دستی/بارگذاری اخیر دست‌نخورده‌اند و باید حفظ شوند.
- قیمت/واحد/موجودی init تازه می‌شود، انتخاب معتبر باقی می‌ماند و اقلام حذف/ناموجود با هشدار از سفارش
  کنار می‌روند؛ مقدار نامتجانس reorder با واحد تازه گرد نمی‌شود. افت واحد به زیر صفر clamp می‌شود؛
  مقادیر اعشاری مانند 0.1 در تغییر تعداد residue نمی‌گذارند. این guardها اصلاح قیمت‌گذاری نیستند.
- محاسبهٔ فعلی عمدی حفظ شد: قیمت خام خطوط + ارسال فقط `sendToMe` + مالیات گرد‌شده، سپس درصد کد و
  سقف. کارت محصول/`totalWithDiscount` درصد محصول را کم می‌کند ولی `calcBill` فعلی کم نمی‌کند؛ اختلاف
  با آزمون ثبت شده، حل مالی نشده است. قیمت سرور/preview مرجع نهایی باقی می‌ماند.
- تصویر تأییدشدهٔ کاربر همان `approved-story-menu.png` در مسیر کامل بالای `spec.md` است؛ هدر حذف،
  دسته‌ها فقط‌آیکن شیشه‌ای. این تصویر فقط مرجع چیدمان است؛ SVG رنگی mock عکس واقعی محصول نیست و
  تصویر کامل طرح را نباید به‌عنوان عکس غذا برید/استفاده کرد. نبود عکس واقعی یعنی قاب خالی.

## شواهد و حدود

`node --test test/basket.test.cjs`: **۱۲/۱۲ PASS**؛ شامل ۴۵ حالت مقایسه با بدنهٔ واقعی `calcBill`
در index، خروجی واقعی `selectedProducts`، افزودن/کاهش و reorder فعلی، جمع ثابت مستقل ۲۳۶، واحدهای
۱/۰٫۵/۰٫۲۵/۰٫۱، صفر و underflow قدیمی، کلیدهای prototype، روز ویژه، reinit و موجودی، reorder یک‌بار،
عدم mutation و جداسازی دو app. مرجع characterization از سورس واقعی استخراج می‌شود، نه فرمول کپی‌شده.
syntax هر دو فایل و `git diff --check` موفق؛ دو مجموعهٔ مرتبط chef-daily و delivery-options نیز
موفق بودند (۱۴ مورد در اجرای محدود). مقایسهٔ hash، حفظ ۱۸ فایل خارج از دامنه را تأیید کرد.

فایل‌های محصول این تحویل فقط `utils/basket.cjs` و `test/basket.test.cjs` هستند؛ هیچ store/template/
auth/backend/mock یا وابستگی تغییر نکرد. یادداشت تأیید در spec و تکمیل ردیف CORE در برنامه ثبت شد.
build/مرورگر/Backend readiness در این تسک ادعا نمی‌شود؛ در WIRE آزمون regression واقعی checkout و
رفت‌وبرگشت دو صفحه لازم است. قفل‌ها تا تحویل نگه داشته و سپس فقط مالکیت همین تسک آزاد می‌شود.
