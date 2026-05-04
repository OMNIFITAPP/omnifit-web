-- Phase 3e: notes notebook (replaces ad-hoc daily_notes for plan-tomorrow)

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  tag text not null default 'thought'
    check (tag in ('thought', 'intention', 'lesson', 'gratitude')),
  expires_at timestamptz,
  saved boolean not null default false,
  archived_at timestamptz,
  linked_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "users manage own notes" on public.notes;
create policy "users manage own notes"
  on public.notes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_active_idx
  on public.notes (user_id, expires_at)
  where archived_at is null;

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- Belt-and-suspenders read policies for the Voices tables — these were added
-- in 0005 already, but spec calls for them again to harden against any partial
-- migration application. All idempotent.
do $$
begin
  if exists (select 1 from pg_class where relname = 'weekly_questions') then
    drop policy if exists "auth users read weekly questions" on public.weekly_questions;
    create policy "auth users read weekly questions"
      on public.weekly_questions for select to authenticated using (true);
  end if;
  if exists (select 1 from pg_class where relname = 'monthly_challenges') then
    drop policy if exists "auth users read monthly challenges" on public.monthly_challenges;
    create policy "auth users read monthly challenges"
      on public.monthly_challenges for select to authenticated using (true);
  end if;
  if exists (select 1 from pg_class where relname = 'voices') then
    drop policy if exists "auth users read voices" on public.voices;
    create policy "auth users read voices"
      on public.voices for select to authenticated using (true);
  end if;
end $$;
