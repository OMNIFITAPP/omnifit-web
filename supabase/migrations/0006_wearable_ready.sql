-- Phase 3d: schema-only prep for Phase 5 wearable integration.
-- Columns are nullable; readiness check-in flow writes wearable_source='manual'.

alter table public.readiness_checkins
  add column if not exists hrv integer,
  add column if not exists resting_hr integer,
  add column if not exists sleep_score_external integer,
  add column if not exists body_battery integer,
  add column if not exists wearable_source text;

comment on column public.readiness_checkins.hrv                  is 'Heart rate variability in ms from wearable';
comment on column public.readiness_checkins.resting_hr           is 'Resting heart rate in bpm from wearable';
comment on column public.readiness_checkins.sleep_score_external is 'Sleep score from wearable (0-100 normalized)';
comment on column public.readiness_checkins.body_battery         is 'Body battery or recovery score from wearable (0-100)';
comment on column public.readiness_checkins.wearable_source      is 'manual | whoop | oura | garmin | apple_health';
