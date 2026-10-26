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

-- 3) Saved courses + progress — one row per learner per course -----------
create table if not exists public.saved_courses (
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null check (char_length(course_id) between 1 and 120),
  status     text not null default 'saved' check (status in ('saved', 'learning', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists saved_courses_user_idx
  on public.saved_courses (user_id, updated_at desc);

-- 4) Learner reviews — public to read, private to write --------------------
create table if not exists public.course_reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_id   text not null check (char_length(course_id) between 1 and 120),
  author_name text not null check (char_length(author_name) between 1 and 60),
  rating      smallint not null check (rating between 1 and 5),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists course_reviews_course_idx
  on public.course_reviews (course_id, created_at desc);
create index if not exists course_reviews_user_idx
  on public.course_reviews (user_id, created_at desc);

-- 5) Row-level security -------------------------------------------------
alter table public.waitlist enable row level security;
alter table public.course_suggestions enable row level security;
alter table public.saved_courses enable row level security;
alter table public.course_reviews enable row level security;

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

-- Saved courses: each learner can read and manage only their own rows.
drop policy if exists "saved_courses_select_own" on public.saved_courses;
create policy "saved_courses_select_own" on public.saved_courses
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saved_courses_insert_own" on public.saved_courses;
create policy "saved_courses_insert_own" on public.saved_courses
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saved_courses_update_own" on public.saved_courses;
create policy "saved_courses_update_own" on public.saved_courses
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_courses_delete_own" on public.saved_courses;
create policy "saved_courses_delete_own" on public.saved_courses
  for delete to authenticated
  using (auth.uid() = user_id);

-- Reviews are publicly readable so every learner can see them;
-- only a signed-in author can create, edit, or delete their own review.
drop policy if exists "course_reviews_select_public" on public.course_reviews;
create policy "course_reviews_select_public" on public.course_reviews
  for select to anon, authenticated
  using (true);

drop policy if exists "course_reviews_insert_own" on public.course_reviews;
create policy "course_reviews_insert_own" on public.course_reviews
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "course_reviews_update_own" on public.course_reviews;
create policy "course_reviews_update_own" on public.course_reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "course_reviews_delete_own" on public.course_reviews;
create policy "course_reviews_delete_own" on public.course_reviews
  for delete to authenticated
  using (auth.uid() = user_id);

-- No UPDATE or DELETE policies on waitlist / suggestions:
-- once submitted, those rows can only be changed in the dashboard.
