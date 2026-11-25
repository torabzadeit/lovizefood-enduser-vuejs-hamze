# lovizefood — customer frontend (Nuxt 2)

The customer-facing ordering site. Related repos:
- Admin panel (Vue 2 + Vuetify, calls `<server>/api/admin/...`):
  https://github.com/torabzadeit/lovizefood-admin-vuejs-torabzade
- The API server itself is in neither repo. `dev-mock/` is a local stand-in only, not the real API.

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
