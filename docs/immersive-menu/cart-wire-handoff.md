# IMMERSIVE-CART-WIRE — 2026-11-21

STATUS: DONE. خط single، ریشه `D:\lovizefood`؛ route پایدار Sol/xhigh؛ claim انتقالی
`8239da06-8af2-4407-b7c4-f8331660b707`. بدون story page/style، backend/auth/mock، commit/push،
زیرعامل یا restart پردازهٔ 3333. UI می‌تواند پس از آزادشدن همین claim شروع شود.

## API فوری برای story UI

- `await store.dispatch('basket/bootstrap')` برای ورود مستقیم؛ همان loader منوی اصلی، با cache
  پس از اولین بار. `force:true` برای refresh. پاسخ نامعتبر/خطا کاتالوگ را خالی نمی‌کند؛ request ID
  پاسخ قدیمی را رد می‌کند و reconcile همیشه تعدادهای زمان پاسخ را حفظ می‌کند. state factory مجزا.
- `state.basket`: `basket:{products,counts,issues}`، `categories`، `initialized/loading/error`،
  `pricing` عمومی، `checkoutIntent` و `storyPosition:{categoryId,productKey}`. دادهٔ پاسخ خام API
  در state ذخیره نمی‌شود. `bootstrap` برای root آن را در result.data برمی‌گرداند؛ UI آن را ذخیره/log نکند.
- getterهای namespaced: `products`, `counts`, `issues`, `selectedProducts`, `orderProducts`,
  `menuCategories`, `menuProducts`, `categoryProducts(id,search='')`, `productData(baseURL)`,
  `itemsTotal`, `estimatedBill`, `billFor(options)`.
- دستهٔ مجازی chef برابر `__chef_daily__` است؛ getterهای دسته/ترتیب، غذای روز را فقط یک‌بار و پیش
  از دسته‌های عادی می‌دهند. root نیز همین طبقه‌بندی را مصرف می‌کند؛ در story دوباره پیاده نکنید.
- `products` مسیر عکس خام API را دارد؛ `productData(axios.defaults.baseURL)`، thumbnail/image را
  به URL نهایی، imageFull را به عکس اصلی یا null و count را به تعداد مشترک تبدیل می‌کند. مسیر absolute
  دوباره prefix نمی‌گیرد. عکس مرجع تأییدشده چیدمان است؛ SVG mock عکس واقعی نیست، فقدان عکس خالی بماند.
- commitها: `basket/increment {key,steps?,dayIndex?}`، `decrement {key,steps?}`، `setCount {key,count}`،
  `reorder` فقط با `takeReorder().lines`. getter productData فقط خواندنی است؛ count را مستقیم تغییر ندهید.
- قبل از router.push('/')، `await dispatch('basket/requestCheckout',{categoryId,productKey})`؛
  root **پس از initialize موفق** با `consumeCheckoutIntent` آن را یک‌بار برمی‌دارد و openCart موجود را
  اجرا می‌کند. مهمان همان login gate عادی را می‌بیند. در خطای init، intent برای retry باقی می‌ماند.
  برای برگشت/back، `commit('basket/rememberStoryPosition',{categoryId,productKey})` و خواندن
  state.storyPosition؛ فقط کلید معتبر کاتالوگ ذخیره می‌شود، نه URL/آدرس/هویت.

## جمع و draft خصوصی

برای footer هم‌ارز نوار فعلی منوی اصلی از **itemsTotal** استفاده کنید: جمع خام اقلام، بدون ارسال،
مالیات یا کد شخصی. **estimatedBill** برآورد عمومی اقلام + مالیات عمومی است؛ با جمع checkout شامل
آدرس/ارسال/کوپن شخصی یکسان ادعا نشود و در صورت نمایش «برآورد» نام بگیرد. root همان calculateBill
CORE را با options خصوصیِ گذرا مصرف می‌کند؛ preview سرور همچنان مرجع پرداخت است. هیچ فرمول مالی
یا تخفیف محصول اصلاح نشده؛ اختلاف شناخته‌شدهٔ کارت/جمع با fixture characterization حفظ شد.

`utils/checkoutDraft.cjs` یک WeakMap خارج از Vuex/storage دارد: به‌ازای app و مالک نشست، یا مهمان
null همان app. root پیش از رفتن به `/immersive-menu` فقط فیلدهای مجاز checkout را می‌گذارد و هنگام
برگشت یک‌بار برمی‌دارد. آدرس دستی/پلاک/مکان/انتخاب تحویل و کوپن همان مشتری حفظ می‌شوند؛ owner عوض‌شده
یا logout draft را باطل می‌کند. token فقط در closure مقایسه می‌شود، PAN/پروفایل/موبایل ذخیره نمی‌شود.
UI حساب یا draft را داخل public basket نگذارد؛ login/auth جدید در دامنهٔ این تحویل نیست.

## شواهد

- CORE + store: ۱۷/۱۷ PASS؛ ۴۵ مقایسهٔ مالی، direct-entry bootstrap، isolation، خطا/پاسخ دیررس،
  تغییر تعداد حین init، یک‌بارمصرف بودن intent و draft مهمان/مشتری. مرجع قدیمی سورس پیش از WIRE با
  hash در `test/fixtures/basket-legacy-index.txt` ثابت شد تا delegation جدید oracle را از بین نبرد.
- `test/basket-wire.browser.cjs`: PASS مهمان و مشتری؛ کلیک واقعی افزودن، stepper، init بدون reset،
  router رفت‌وبرگشت با route فقط در حافظهٔ تست، حفظ آدرس دستی/پلاک و کوپن، login gate/intent و preview
  عادی 200؛ صفر create، بدون pageerror و بدون دادهٔ خصوصی در public store. آدرس‌ها fixture کنترل‌شده،
  بقیه API روی mock موجود 3003؛ این آزمون اثبات backend واقعی نیست.
- تست آدرس موجود برای API جدید count به‌روز شد؛ syntax و diff بررسی شدند. Playwright MCP مرورگر
  مشغول داشت؛ مرورگر headless مستقل با همان runtime اجرا و فقط مرورگر خود آزمون بسته شد.
- build کامل تا UI نهایی تکرار نشد. قفل‌ها تا تحویل حفظ و سپس فقط مالکیت این تسک آزاد می‌شود.
