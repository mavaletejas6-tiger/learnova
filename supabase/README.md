# Learnova backend (Supabase)

Learnova is a static site deployed from the repository root to GitHub Pages. There is no
application server. Supabase is optional and provides the backend when you want accounts,
cross-device saved courses, and shared learner reviews:

```
Browser (GitHub Pages)
  ├─ supabase-js ──► Supabase Auth   (email one-time code)
  └─ supabase-js ──► Supabase REST   (Postgres + row-level security)
```

With no Supabase project connected, Learnova still works in **local mode**. Saved courses,
progress, profiles, and reviews stay in the browser’s `localStorage`. Nothing is sent anywhere.

The database definition lives in [`schema.sql`](./schema.sql).

---

## What the backend is used for

| Feature | Table | Who can read it | Who can write it |
| --- | --- | --- | --- |
| Email course picks / early access | `waitlist` | The signed-in owner of the row | Anyone (anonymous inserts allowed) |
| Suggest a free course (live scan page) | `course_suggestions` | The signed-in owner of the row | Anyone (anonymous inserts allowed) |
| Saved courses and progress | `saved_courses` | Only the signed-in owner | Only the signed-in owner |
| Learner reviews | `course_reviews` | Everyone, including signed-out visitors | Only the signed-in author |

Course content itself is never stored by Learnova. Every course links to its original provider.
The catalogue is static data in `assets/js/data.js`.

---

## 1. Create the project

1. Open <https://supabase.com/dashboard> and create a project. The free tier is enough.
2. Wait for database provisioning to finish.
3. Note the **Project URL** and the **publishable/anon public** key from
   **Project Settings → API** (in newer dashboards: **Project Settings → API Keys**).

No `service_role` or secret key belongs in the browser.

## 2. Create the tables and policies

1. Open **SQL Editor → New query**.
2. Paste the full contents of [`schema.sql`](./schema.sql).
3. Click **Run**.

The script is safe to run more than once. It creates the four tables, indexes, enables
row-level security, and recreates every policy.

Check it worked:

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('waitlist', 'course_suggestions', 'saved_courses', 'course_reviews')
order by tablename, policyname;
```

You should see 12 policies in total:

- `waitlist_insert`, `waitlist_select_own`
- `suggestions_insert`, `suggestions_select_own`
- `saved_courses_select_own`, `saved_courses_insert_own`,
  `saved_courses_update_own`, `saved_courses_delete_own`
- `course_reviews_select_public`, `course_reviews_insert_own`,
  `course_reviews_update_own`, `course_reviews_delete_own`

## 3. Connect the site

Open [`assets/js/config.js`](../assets/js/config.js) and fill in both values:

```js
window.LEARNOVA_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT-REF.supabase.co",
  supabaseAnonKey: "sb_publishable_..."
};
```

Use the **publishable/anon** key only. Every catalogue page and the live scan page load this
same file, so accounts and saved courses are shared across the site. Commit and push to `main`;
the GitHub Pages workflow redeploys automatically.

Leaving either value empty keeps the site in local mode.

## 4. Make the 6-digit code work

Learnova asks for a **6-digit code**, not a magic link. Supabase’s default templates only contain
a link, so edit the email templates.

Go to **Authentication → Emails** (older dashboards: **Authentication → Email Templates**) and
update both:

### Confirm sign up

Subject: `Your Learnova sign-in code`

```html
<h2>Welcome to Learnova</h2>
<p>Your 6-digit sign-in code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Enter it on the Learnova sign-in screen. It expires in 1 hour.</p>
<p>If you did not request this email, you can ignore it.</p>
```

### Magic link or OTP

Subject: `Your Learnova sign-in code`

```html
<h2>Your Learnova sign-in code</h2>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Enter it on the Learnova sign-in screen. It expires in 1 hour.</p>
<p>If you did not request this email, you can ignore it.</p>
```

Keep `{{ .Token }}` exactly as written. Without it, the email contains no code and
`verifyOtp` cannot succeed.

## 5. Set the site URL

Go to **Authentication → URL Configuration**:

- **Site URL:** `https://mavaletejas6-tiger.github.io/learnova/`
- **Redirect URLs:** add the same URL, plus `http://localhost:8000/` when testing locally.

This is also where a learner lands if they click the link in the email instead of typing the code.

If you deploy under a different domain or repository path, update both values and the canonical
URLs in the page `<head>` metadata.

## 6. Test the backend

1. Open the live site with a hard refresh (**Ctrl+F5**).
2. Click **Sign in**, enter an email, and request a code.
3. Enter the 6-digit code. The header should show the learner’s name or email.
4. Save a course and change its status to **In progress**.
5. Open **Table Editor → saved_courses**. There should be one row for that user and course.
6. Open a course → **Learner reviews**, submit a review, and check `course_reviews`.
7. Open the site in a second browser, sign in with the same email, and confirm the saved course
   and published review appear.
8. On the live scan page, confirm the sign-in button appears and the suggestion form inserts into
   `course_suggestions`. The scan page reads the same `config.js`.

### Local mode test

With empty config values:

1. Save a course, change its status, and write a review.
2. In DevTools → Application → Local Storage, look for keys starting with `lnv1_`:
   `lnv1_saved`, `lnv1_progress`, `lnv1_reviews`, `lnv1_profile`, `lnv1_recent`.
3. Reload the page. The state should survive.
4. Open a private window. It should start empty — local mode does not sync between browsers.

---

## Data notes

- **Course IDs** are stable strings from `assets/js/data.js`, for example `cs50x`. The schema
  stores them as text rather than using a foreign key because the catalogue is a static file.
- **Saved status** is one of `saved`, `learning`, or `completed`. A course with status `learning`
  or `completed` also counts as saved in the interface.
- **Reviews** are public to read. The browser renders them as plain text with HTML escaping.
  Signed-out visitors can write a review, but it is stored only in their browser. Sign in to
  publish a review to Supabase.
- **Local reviews are not uploaded automatically** after sign-in. This is deliberate: there is no
  reliable way to attribute an anonymous local review without asking the learner.
- **Names** on remote reviews come from the profile name entered at sign-in time and are stored in
  `course_reviews.author_name`.
- **One review per submission**, not one per learner. Authors may update or delete their own rows
  through the Supabase API, but the current UI does not expose editing or deleting.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Site still says “Backend not connected yet” | Check both values in `assets/js/config.js`, then hard-refresh. A cached copy of `config.js` can hide a new key. |
| Sign-in button is missing on the live scan | `DB_READY` is false: config values are empty, or the Supabase script was blocked. Check the browser console and any content blocker. |
| `relation "public.waitlist" does not exist` | Run `schema.sql` in the SQL Editor. |
| `new row violates row-level security policy` | Run `schema.sql` again. The relevant insert/update policy is missing. |
| `duplicate key value violates unique constraint "waitlist_email_key"` | That email is already on the list. The site treats this as success. |
| No email arrives | Check **Authentication → Logs** and the spam folder. The built-in email service has strict rate limits. |
| `email rate limit exceeded` | Wait, or configure **Authentication → SMTP Settings** with your own provider. |
| Code is invalid or expired | Request a new code. Codes expire after about an hour. |
| Email contains a link but no code | Add `{{ .Token }}` to both email templates as shown above. |
| `Failed to fetch` | The project URL is wrong, the project is paused, or a network blocker is active. |
| Reviews submit locally even though I am signed in | The remote insert failed (network, RLS, or auth), so Learnova fell back to local storage. Check the console warning. |
| Saved course does not sync | The learner must be signed in before saving or the row must be written after sign-in. Check `saved_courses` and the browser console. |

The built-in Supabase email sender is intended for testing. For real traffic, configure a custom
SMTP provider under **Authentication → SMTP Settings**.

## Security notes

- Only the **anon/publishable** key belongs in `assets/js/config.js`. Never put a
  `service_role` or secret key in any deployed file.
- RLS is enabled on all four tables. The public cannot read the waitlist or suggestions, cannot
  read another learner’s saved courses, and cannot write a review as another user.
- Anonymous inserts are allowed on `waitlist` and `course_suggestions`. That is convenient, but
  it also means they can be spammed. For a public launch, add a CAPTCHA (for example Cloudflare
  Turnstile) or move inserts behind an Edge Function.
- `course_reviews` is publicly readable by design. Do not put private information in a review.
- To read all submissions, use the Supabase **Table Editor** or the service role from a trusted
  server-side script. Never expose the service role in the site.
- The site escapes course data and review text before inserting it into the DOM. Still, treat
  user-generated review content as public content and moderate it if the site grows.

## Schema changes

If you change `schema.sql` after a project is already running, re-run the whole file in the SQL
Editor. The table definitions use `if not exists`; destructive column changes would need a
separate migration and are not included here.
