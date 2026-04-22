-- Follow mode and active dims preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS follow_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS active_dims text[] NOT NULL DEFAULT ARRAY['neuro','physical','cognitive','emotional'];

-- Session completions — records every completed practice session
CREATE TABLE IF NOT EXISTS public.session_completions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension        text NOT NULL,
  tier             text NOT NULL CHECK (tier IN ('P', 'S', 'M')),
  session_name     text,
  felt             text CHECK (felt IN ('easy', 'right', 'hard')),
  completed_at     timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS session_completions_user_month_idx
  ON public.session_completions (user_id, completed_at DESC);

ALTER TABLE public.session_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own completions"
  ON public.session_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users read own completions"
  ON public.session_completions FOR SELECT
  USING (auth.uid() = user_id);
