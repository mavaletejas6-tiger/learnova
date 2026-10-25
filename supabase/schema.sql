-- =====================================================================
--  LEARNOVA — Supabase schema
--  Run this once:
--    Supabase Dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

-- 1) Waitlist — rows created by the "Get early access" form -------------
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  full_name  text not null check (char_length(full_name) between 2 and 80),
  email      text not null,
  language   text not null default 'English',
  created_at timestamptz not null default now()
);

-- one row per email, case-insensitive
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

-- 2) Course suggestions — rows created by the "Suggest a free course" form
create table if not exists public.course_suggestions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  course_link text not null check (char_length(course_link) between 10 and 500),
  language    text not null default 'English',
  topic       text not null check (char_length(topic) between 2 and 60),
  created_at  timestamptz not null default now()
);

-- 3) Row-level security -------------------------------------------------
alter table public.waitlist enable row level security;
alter table public.course_suggestions enable row level security;

-- Anyone may add themselves to the waitlist…
drop policy if exists "waitlist_insert" on public.waitlist;
create policy "waitlist_insert" on public.waitlist
  for insert to anon, authenticated
  with check (true);

-- …but a learner can only read their own row (never anyone else's).
drop policy if exists "waitlist_select_own" on public.waitlist;
create policy "waitlist_select_own" on public.waitlist
  for select to authenticated
  using (auth.uid() = user_id);

-- Anyone may suggest a course…
drop policy if exists "suggestions_insert" on public.course_suggestions;
create policy "suggestions_insert" on public.course_suggestions
  for insert to anon, authenticated
  with check (true);

-- …and only the sender can read their own suggestions.
drop policy if exists "suggestions_select_own" on public.course_suggestions;
create policy "suggestions_select_own" on public.course_suggestions
  for select to authenticated
  using (auth.uid() = user_id);

-- No UPDATE or DELETE policies on purpose:
-- once submitted, rows can only be changed by you (the service role key
-- in the dashboard). The anon key in the browser cannot edit or wipe them.
