-- Phase 3d: live voices + daily notes for tomorrow planning.
-- The original `voices` table from migration 0001 is replaced; drop and recreate.

drop policy if exists "voices_read_all"    on public.voices;
drop policy if exists "voices_insert_self" on public.voices;
drop table if exists public.voices cascade;

-- ─── Weekly questions (set by coach) ───────────────────────────
create table if not exists public.weekly_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  week_start date not null unique,
  created_at timestamptz default now()
);

alter table public.weekly_questions enable row level security;

drop policy if exists "weekly_questions_read" on public.weekly_questions;
create policy "weekly_questions_read"
  on public.weekly_questions for select
  to authenticated
  using (true);

-- ─── Monthly challenges (set by coach) ─────────────────────────
create table if not exists public.monthly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  month_start date not null unique,
  created_at timestamptz default now()
);

alter table public.monthly_challenges enable row level security;

drop policy if exists "monthly_challenges_read" on public.monthly_challenges;
create policy "monthly_challenges_read"
  on public.monthly_challenges for select
  to authenticated
  using (true);

-- ─── Voices (member responses) ─────────────────────────────────
create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.weekly_questions(id) on delete cascade not null,
  content text not null,
  resonance_count integer not null default 0,
  created_at timestamptz default now()
);

alter table public.voices enable row level security;

drop policy if exists "voices_read"        on public.voices;
drop policy if exists "voices_insert_self" on public.voices;
drop policy if exists "voices_update_self" on public.voices;
drop policy if exists "voices_delete_self" on public.voices;

create policy "voices_read"
  on public.voices for select
  to authenticated
  using (true);

create policy "voices_insert_self"
  on public.voices for insert
  with check (auth.uid() = user_id);

create policy "voices_update_self"
  on public.voices for update
  using (auth.uid() = user_id);

create policy "voices_delete_self"
  on public.voices for delete
  using (auth.uid() = user_id);

-- ─── Voice resonances (one per user per voice) ────────────────
create table if not exists public.voice_resonances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  voice_id uuid references public.voices(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, voice_id)
);

alter table public.voice_resonances enable row level security;

drop policy if exists "voice_resonances_read_self"   on public.voice_resonances;
drop policy if exists "voice_resonances_insert_self" on public.voice_resonances;
drop policy if exists "voice_resonances_delete_self" on public.voice_resonances;

create policy "voice_resonances_read_self"
  on public.voice_resonances for select
  using (auth.uid() = user_id);

create policy "voice_resonances_insert_self"
  on public.voice_resonances for insert
  with check (auth.uid() = user_id);

create policy "voice_resonances_delete_self"
  on public.voice_resonances for delete
  using (auth.uid() = user_id);

-- Auto-maintain resonance_count on parent voice
create or replace function public.bump_voice_resonance() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.voices set resonance_count = resonance_count + 1 where id = new.voice_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.voices set resonance_count = greatest(resonance_count - 1, 0) where id = old.voice_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists voice_resonances_count on public.voice_resonances;
create trigger voice_resonances_count
  after insert or delete on public.voice_resonances
  for each row execute function public.bump_voice_resonance();

-- ─── Voice reports (silent moderation) ────────────────────────
create table if not exists public.voice_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  voice_id uuid references public.voices(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (reporter_id, voice_id)
);

alter table public.voice_reports enable row level security;

drop policy if exists "voice_reports_insert_self" on public.voice_reports;
drop policy if exists "voice_reports_read_self"   on public.voice_reports;

create policy "voice_reports_read_self"
  on public.voice_reports for select
  using (auth.uid() = reporter_id);

create policy "voice_reports_insert_self"
  on public.voice_reports for insert
  with check (auth.uid() = reporter_id);

-- ─── Daily notes (Plan Tomorrow personal note) ────────────────
create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date)
);

alter table public.daily_notes enable row level security;

drop policy if exists "users manage own notes" on public.daily_notes;
create policy "users manage own notes"
  on public.daily_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists daily_notes_updated_at on public.daily_notes;
create trigger daily_notes_updated_at
  before update on public.daily_notes
  for each row execute function public.set_updated_at();

-- ─── Seed: current week + month ───────────────────────────────
insert into public.weekly_questions (question, week_start)
values (
  'What did you notice this week that you would have missed a year ago?',
  date_trunc('week', current_date)::date
)
on conflict (week_start) do nothing;

insert into public.monthly_challenges (title, description, month_start)
values (
  'Morning light',
  '10 minutes of natural light before 9am, every day this month. Outside, phone away.',
  date_trunc('month', current_date)::date
)
on conflict (month_start) do nothing;
