-- Phase 3f: structural changes informed by real user feedback.

alter table public.profiles
  add column if not exists app_picks_for_me boolean not null default true,
  add column if not exists capacity_explained_dismissed boolean not null default false,
  add column if not exists last_seen_date date;

create table if not exists public.weekly_debriefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_debriefs enable row level security;
drop policy if exists "users manage own debriefs" on public.weekly_debriefs;
create policy "users manage own debriefs"
  on public.weekly_debriefs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists weekly_debriefs_updated_at on public.weekly_debriefs;
create trigger weekly_debriefs_updated_at
  before update on public.weekly_debriefs
  for each row execute function public.set_updated_at();

alter table public.circles
  add column if not exists description text;

create table if not exists public.circle_rsvps (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'going' check (status in ('going','maybe')),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

alter table public.circle_rsvps enable row level security;
drop policy if exists "circle_rsvps_read"       on public.circle_rsvps;
drop policy if exists "circle_rsvps_write_self" on public.circle_rsvps;
create policy "circle_rsvps_read"
  on public.circle_rsvps for select to authenticated using (true);
create policy "circle_rsvps_write_self"
  on public.circle_rsvps for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.bump_circle_spots() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.circles set current_spots = current_spots + 1 where id = new.circle_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.circles set current_spots = greatest(current_spots - 1, 0) where id = old.circle_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists circle_rsvps_count on public.circle_rsvps;
create trigger circle_rsvps_count
  after insert or delete on public.circle_rsvps
  for each row execute function public.bump_circle_spots();
