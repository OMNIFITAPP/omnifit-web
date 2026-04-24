-- Phase 3b: primary focus, completion sound, voices attribution

-- profiles: settings added in Account
alter table public.profiles
  add column if not exists primary_focus text
    check (primary_focus in (
      'longevity','fat_loss','strength','endurance','sport_performance','general_capability'
    )),
  add column if not exists completion_sound boolean not null default true;

-- voices: denormalized attribution so Report/Display doesn't require a join
alter table public.voices
  add column if not exists display_name text,
  add column if not exists member_since timestamptz;
