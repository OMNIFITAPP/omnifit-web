-- Phase 3c: daily readiness check-ins + user card order preference

create table if not exists public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  sleep smallint not null,
  body smallint not null,
  mind smallint not null,
  nourishment smallint not null,
  composite smallint not null,
  state text not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);

alter table public.readiness_checkins enable row level security;

drop policy if exists "users read own checkins"   on public.readiness_checkins;
drop policy if exists "users insert own checkins" on public.readiness_checkins;
drop policy if exists "users update own checkins" on public.readiness_checkins;

create policy "users read own checkins"
  on public.readiness_checkins for select
  using (auth.uid() = user_id);

create policy "users insert own checkins"
  on public.readiness_checkins for insert
  with check (auth.uid() = user_id);

create policy "users update own checkins"
  on public.readiness_checkins for update
  using (auth.uid() = user_id);

-- Drag-to-reorder Today cards — per-user preference persisted on profile.
-- Stored as an ordered jsonb array like '["neuro","physical","cognitive","emotional"]'.
alter table public.profiles
  add column if not exists order_preference jsonb;
