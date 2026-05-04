-- Phase 3e: seasonal commitments (replaces single profile.commit_why with a per-season log)

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  season text not null check (season in ('Spring', 'Summer', 'Fall', 'Winter')),
  year int not null,
  name text,
  why text,
  focus_dimension text check (focus_dimension in ('neuro', 'physical', 'cognitive', 'emotional')),
  created_at timestamptz not null default now(),
  unique (user_id, season, year)
);

alter table public.commitments enable row level security;

drop policy if exists "users manage own commitments" on public.commitments;
create policy "users manage own commitments"
  on public.commitments for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill — copy each onboarded user's existing commit_why into a row for
-- the season at signup. month_part(member_since) → season heuristic
-- (Northern hemisphere; matches client logic).
insert into public.commitments (user_id, season, year, name, why, focus_dimension)
select
  p.id,
  case
    when extract(month from coalesce(p.member_since, current_date))::int between 3 and 5  then 'Spring'
    when extract(month from coalesce(p.member_since, current_date))::int between 6 and 8  then 'Summer'
    when extract(month from coalesce(p.member_since, current_date))::int between 9 and 11 then 'Fall'
    else 'Winter'
  end,
  extract(year from coalesce(p.member_since, current_date))::int,
  p.name,
  p.commit_why,
  p.focus_dim
from public.profiles p
where p.commit_why is not null
on conflict (user_id, season, year) do nothing;
