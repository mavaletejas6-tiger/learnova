# Learnova backend (Supabase)

Learnova is a static site, so there is no separate server to deploy. Supabase provides the backend:

```
Browser (GitHub Pages)
  ├─ supabase-js ──► Supabase Auth   (email one-time code)
  └─ supabase-js ──► Supabase REST   (Postgres + row-level security)
```

Everything is already wired in `index.html`:

- **Sign in** — email → 6-digit code → session (`supabase.auth.signInWithOtp` / `verifyOtp`).
- **Get early access** — inserts into `public.waitlist`.
- **Suggest a free course** — inserts into `public.course_suggestions`.
- **RLS** — anyone can insert; signed-in learners can only read their own rows.

The database definition lives in [`schema.sql`](./schema.sql).

---

## What is still missing

The site is in **demo mode** until a Supabase project is connected. Two things are needed:

1. Run the schema in a Supabase project.
2. Put the project URL and **anon/public** key into `index.html`.

No secret key ever goes in the browser. The anon/public key is safe to expose because RLS controls access.

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard> and create a project (free tier is enough).
2. Wait for the database to finish provisioning.

## 2. Create the tables

1. Open **SQL Editor → New query**.
2. Paste the full contents of [`supabase/schema.sql`](./schema.sql).
3. Click **Run**.

The file is safe to run again: it uses `if not exists` and recreates the policies.

Check it worked:

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('waitlist', 'course_suggestions')
order by tablename, policyname;
```

You should see four policies: `waitlist_insert`, `waitlist_select_own`,
`suggestions_insert`, `suggestions_select_own`.

## 3. Connect the site

Open `index.html` and find the block marked:

```js
/* 5) SUPABASE — real sign-in + database */
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```

Fill them from **Project Settings → API** (in newer dashboards: **Project Settings → API Keys**):

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_..."; // or the legacy anon public key
```

Use the **publishable/anon** key only. Never put a `service_role` or secret key in this file.

Commit and push to `main`; GitHub Pages redeploys automatically.

## 4. Make the 6-digit code work

The site asks for a **6-digit code**, not a magic link. Supabase's default templates only
contain a link, so edit the email templates.

Go to **Authentication → Emails** (older dashboards: **Authentication → Email Templates**)
and update both:

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
- **Redirect URLs:** add the same URL, plus `http://localhost:8000/` if you test locally.

This is also where the magic link returns if a learner clicks the link instead of typing the code.

## 6. Test

1. Open the live site.
2. The Sign in button should now be visible.
3. Click **Sign in**, enter an email, and check for the 6-digit code.
4. Enter the code. The navbar should show the signed-in email.
5. Submit the early-access form, then check **Table Editor → waitlist**.
6. Submit a course suggestion, then check **Table Editor → course_suggestions**.

If the page still says "Backend not connected yet", the two constants are empty or the
deployed version is cached. Hard-refresh with **Ctrl+F5**.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `relation "public.waitlist" does not exist` | Run `schema.sql` in the SQL Editor. |
| `new row violates row-level security policy` | Run `schema.sql` again; the insert policies are missing. |
| No email arrives | Check **Authentication → Logs**, spam folder, and the email template. The built-in email service has strict rate limits. |
| `email rate limit exceeded` | Wait, or configure **Authentication → SMTP Settings** with your own provider. |
| Code is invalid or expired | Request a new code; codes expire after 1 hour. |
| `duplicate key value violates unique constraint "waitlist_email_key"` | That email is already on the list. The site shows "You are already on the list". |
| `Failed to fetch` | The project URL is wrong or the project is paused. |
| Sign-in button is missing | `DB_READY` is false: URL/key empty, or the Supabase script did not load. |

The built-in Supabase email sender is intended for testing. For real traffic, configure a
custom SMTP provider under **Authentication → SMTP Settings**.

## Security notes

- Only the **anon/public** key belongs in `index.html`.
- RLS is enabled on both tables. There are deliberately no `UPDATE` or `DELETE` policies,
  so the browser cannot edit or wipe submissions.
- Both forms are open to anonymous inserts so people can join without an account. That also
  means they can be spammed. For a public launch, add a CAPTCHA (e.g. Cloudflare Turnstile)
  or move inserts behind an Edge Function.
- To read submissions, use the Supabase **Table Editor** or the service role from a trusted
  server/script. Do not expose the service role in the site.
