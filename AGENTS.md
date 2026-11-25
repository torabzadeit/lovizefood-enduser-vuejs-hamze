# lovizefood — customer frontend (Nuxt 2)

The customer-facing ordering site. Related repos:
- Admin panel (Vue 2 + Vuetify, calls `<server>/api/admin/...`):
  https://github.com/torabzadeit/lovizefood-admin-vuejs-torabzade
- The API server itself is in neither repo. `dev-mock/` is a local stand-in only, not the real API.

## graphify

وقتی کاربر `/graphify` را درخواست کرد، اسکیل نصب‌شدهٔ `graphify` را طبق روش پروژه اجرا کن.

- برای سؤال دربارهٔ کد یا معماری، اگر `graphify-out/graph.json` موجود است، از ریشهٔ پروژه ابتدا `graphify query "<question>"` را اجرا کن. برای دنبال‌کردن ارتباط‌ها از `graphify path` و برای بررسی یک مفهوم از `graphify explain` استفاده کن. برای تأیید جزئیات به فایل‌های مرجع رجوع کن.
- پس از تغییر کد، اگر گراف موجود است، از ریشهٔ پروژه `graphify update` را اجرا کن تا گراف ساختاری در محدودهٔ اسکن قبلی به‌روز شود.

## Rule: log every backend-affecting frontend change in `docs/BACKEND_CHANGES.md`

We do not develop the backend or the admin panel here. When the backend developer later connects
the new frontend, `docs/BACKEND_CHANGES.md` is their checklist, so it must stay complete.

In the same change, update that file whenever a frontend change does any of these:
- calls a new endpoint, or a new method/path on an existing one
- reads a new field from a response, or relies on a new meaning of an existing field or status
  code (e.g. what status 13 means for a pickup order)
- sends a new field or a new value in a request body (e.g. `delivery_type: "snapp"`), or sends
  values the server may not accept (e.g. 15-minute delivery times)
- needs new server behaviour (validation, calculation, a notification being created, caching)
- needs something new in the admin panel (a setting, a form field, a label in the reports)
- adds data to `dev-mock/` that the real API does not send yet (the mock hides the gap)

How to update it:
1. Add or edit the numbered section, split into **سرور** / **پنل مدیریت** / **فرونت** parts,
   with the exact endpoint, field names and an example JSON. Say what the frontend does while
   the backend lacks it (its fallback).
2. Add or update the row in the summary table at the top (with priority).
3. Add a row to «تاریخچهٔ تغییرات» at the bottom (newest first), with date and frontend files.
4. Keep the `BACKEND:` / `FOR THE BACKEND:` contract comment next to the code that relies on it.
   The MD file is the summary, the comment is the detail at the point of use.
5. When unsure whether the server already supports something, write «بررسی شود» rather than
   guessing. When admin-panel code is involved, name the file in the admin repo (it can be
   cloned read-only into the scratchpad to check).

Purely visual changes (styles, layout, motion, fonts, copy that is not from the API) do not go
in the file.

The document is written in Persian, with code identifiers left in English.

<!-- CODEX-PLAYBOOK:START -->
## روش کار Codex

برای مستر، «تسک بعدی»، برنامه‌ریزی درخواست و ادامهٔ پروژه از `$codex-playbook` استفاده کن؛ راهنمای همین پروژه در `docs/codex-playbook.md` و تنظیمات در `.codex/playbook.json` است. ابتدا قواعد محصول در `CLAUDE.md` (اگر موجود است)، برنامهٔ کار و تحویل فعلی را بخوان.

این تطبیق فقط دستورهای اجرای Claude، انتخاب مدل و هماهنگی ایجنت‌ها را جایگزین می‌کند. قواعد محصول، تأیید محتوا/طراحی، محرمانگی، آزمون و تحویل پابرجاست. ستون مدل قدیمی برای سابقه حفظ می‌شود؛ مدل اجرایی را از `workflow.py route` بگیر. مدل خارجیِ صریح را خودسرانه جایگزین نکن.

مستر با مدل‌های بومی Codex کار را به ایجنت‌های مشخص واگذار می‌کند. حداکثر سه worker در مجموع دستگاه و یک نویسنده در هر worktree؛ کار موازیِ نوشتنی فقط در worktreeهای جدا و پس از فعال‌شدن محافظ مورداعتماد مجاز است. هر فایل بلافاصله پیش از ویرایش قفل می‌شود. قفل و claim نشست دیگر را حذف نکن. برای دستور مدل متفاوت، `fork_turns="none"` و مدل/effort صریح لازم است.

«ادامه» برای پروژهٔ ثبت‌شده به تحویل فعلی پروژه/خط برمی‌گردد؛ چک‌لیست مهاجرت رایانه تنها وقتی هنوز واقعاً مورد باز است خوانده می‌شود. نشست مستر تازه در نوار کناری را فقط با درخواست کاربر بساز. نصب یا آزمایش این playbook مجوز شروع تسک محصول نیست.
<!-- CODEX-PLAYBOOK:END -->

<!-- CODEX-NO-ASTRA:START -->
# محدودیت صریح مدل، 2026-11-15
از این لحظه در هیچ پروژه، مستر، ایجنت، fallback یا ارتقای مدل از هیچ مدل Astra استفاده نکن. جایگزین معماری و تصمیم دشوار gpt-6.1-sol/high و کار حساس gpt-6.1-sol/xhigh است. این دستور بر جدول‌ها و نقش‌های قدیمی مقدم است. ایجنت Astra متعلق به خودت را متوقف کن، کار و قفلش را حفظ کن و با مدل مجاز به‌طور امن از سر بگیر. اگر تعریف role بارگذاری‌شده هنوز Astra دارد، آن role را اجرا نکن؛ مدل و effort مجاز را صریح به یک ایجنت تازه با fork_turns=none بده. مدل یک ایجنت فعال را عوض‌شده فرض نکن.
<!-- CODEX-NO-ASTRA:END -->
