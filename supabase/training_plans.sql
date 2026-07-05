-- Drop and recreate to ensure clean schema
DROP TABLE IF EXISTS public.training_plans CASCADE;

CREATE TABLE public.training_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             text NOT NULL,
  description       text,
  sport_type        text NOT NULL CHECK (sport_type IN ('skating','cycling','gym')),
  weeks             integer NOT NULL DEFAULT 4 CHECK (weeks BETWEEN 1 AND 52),
  sessions_per_week integer NOT NULL DEFAULT 3 CHECK (sessions_per_week BETWEEN 1 AND 14),
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX training_plans_coach_id_idx   ON public.training_plans(coach_id);
CREATE INDEX training_plans_athlete_id_idx ON public.training_plans(athlete_id);
CREATE INDEX training_plans_status_idx     ON public.training_plans(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS training_plans_updated_at ON public.training_plans;
CREATE TRIGGER training_plans_updated_at
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "coach_manage_plans" ON public.training_plans;
DROP POLICY IF EXISTS "athlete_view_plans" ON public.training_plans;

-- Coach can manage their own plans
CREATE POLICY "coach_manage_plans" ON public.training_plans
  FOR ALL USING (coach_id = auth.uid());

-- Athlete can view plans assigned to them
CREATE POLICY "athlete_view_plans" ON public.training_plans
  FOR SELECT USING (athlete_id = auth.uid());
