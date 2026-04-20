-- OMNIFIT profiles + billing schema
-- One row per authenticated user, created on signup via trigger below.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  commit_why text,
  focus_dim text check (focus_dim in ('neuro','physical','cognitive','emotional')),
  member_since date,

  -- Billing
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','expired','cancelled')),
  plan_tier text check (plan_tier in ('monthly','annual','founding')),
  trial_started_at timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;

create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);

-- ─── Voices (Club > Voices tab) ─────────────────────────────
create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('weekly','monthly')),
  content text not null,
  week_number int not null,
  created_at timestamptz not null default now()
);

alter table public.voices enable row level security;
drop policy if exists "voices_read_all"    on public.voices;
drop policy if exists "voices_insert_self" on public.voices;
create policy "voices_read_all"    on public.voices for select using (true);
create policy "voices_insert_self" on public.voices for insert with check (auth.uid() = user_id);

-- ─── Circles (Club > Circles tab) ───────────────────────────
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  dimension text not null check (dimension in ('neuro','physical','cognitive','emotional')),
  title text not null,
  datetime timestamptz not null,
  location text not null,
  host_id uuid references auth.users(id) on delete set null,
  host_name text,
  host_member_since date,
  max_spots int not null default 6,
  current_spots int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.circles enable row level security;
drop policy if exists "circles_read_all"    on public.circles;
drop policy if exists "circles_insert_self" on public.circles;
create policy "circles_read_all"    on public.circles for select using (true);
create policy "circles_insert_self" on public.circles for insert with check (auth.uid() = host_id);
