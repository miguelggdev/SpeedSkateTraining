-- ============================================================
-- CLUBS
-- ============================================================
DROP TABLE IF EXISTS public.clubs CASCADE;
CREATE TABLE public.clubs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  city        text,
  country     text DEFAULT 'Colombia',
  logo_url    text,
  admin_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_read"  ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_admin" ON public.clubs FOR ALL USING (admin_id = auth.uid());

-- Add club_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL;

-- ============================================================
-- GYM EXERCISES LIBRARY
-- ============================================================
DROP TABLE IF EXISTS public.exercises CASCADE;
CREATE TABLE public.exercises (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  category     text NOT NULL CHECK (category IN ('legs','core','upper','plyometric','flexibility','cardio')),
  description  text,
  muscle_group text,
  video_url    text,
  is_skate_specific boolean DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.exercises (name, category, muscle_group, description, is_skate_specific) VALUES
  ('Sentadilla',             'legs',        'Cuádriceps, glúteos',       'Posición de patinaje, talones al ancho de hombros', true),
  ('Sentadilla búlgara',     'legs',        'Cuádriceps, glúteos',       'Pie trasero elevado, replika posición de empuje', true),
  ('Peso muerto rumano',     'legs',        'Isquiotibiales, glúteos',   'Caderas atrás, espalda recta', true),
  ('Prensa de pierna',       'legs',        'Cuádriceps',                'Ángulo de 90° igual al de patinaje', true),
  ('Extensión de rodilla',   'legs',        'Cuádriceps',                'Aislamiento del cuádriceps', false),
  ('Curl de pierna',         'legs',        'Isquiotibiales',            'Aislamiento de isquiotibiales', false),
  ('Hip thrust',             'legs',        'Glúteos',                   'Extensión de cadera explosiva', true),
  ('Step-up con mancuerna',  'legs',        'Cuádriceps, glúteos',       'Simula el empuje lateral del patinaje', true),
  ('Salto al cajón',         'plyometric',  'Piernas completas',         'Explosividad de tren inferior', true),
  ('Salto lateral',          'plyometric',  'Aductores, glúteos',        'Simula el movimiento lateral del patinaje', true),
  ('Salto de tijera',        'plyometric',  'Piernas, coordinación',     'Pliometría básica', false),
  ('Skater jump',            'plyometric',  'Glúteos, aductores',        'Imitación directa del movimiento de patinaje', true),
  ('Plancha frontal',        'core',        'Core anterior',             'Mantener posición de patinaje', true),
  ('Plancha lateral',        'core',        'Oblicuos, core',            'Estabilización lateral', true),
  ('Dead bug',               'core',        'Core profundo',             'Control lumbar en movimiento', true),
  ('Russian twist',          'core',        'Oblicuos',                  'Rotación de tronco', false),
  ('Jalón al pecho',         'upper',       'Dorsal, bíceps',            'Fuerza de tren superior', false),
  ('Remo en máquina',        'upper',       'Dorsal, romboides',         'Postura y fuerza de espalda', false),
  ('Flexiones',              'upper',       'Pectoral, tríceps',         'Fuerza funcional de empuje', false),
  ('Estiramiento de cadera', 'flexibility', 'Flexores de cadera',        'Clave para posición baja de patinaje', true),
  ('Estiramiento de isquios','flexibility', 'Isquiotibiales',            'Prevención de lesiones', true),
  ('Foam roller piernas',    'flexibility', 'Piernas completas',         'Recuperación muscular', false);

-- ============================================================
-- GYM SESSIONS
-- ============================================================
DROP TABLE IF EXISTS public.gym_sessions CASCADE;
CREATE TABLE public.gym_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_min integer,
  notes        text,
  rpe          integer CHECK (rpe BETWEEN 1 AND 10),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gym_sessions_user_id_idx ON public.gym_sessions(user_id);
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gym_sessions_owner" ON public.gym_sessions FOR ALL USING (user_id = auth.uid());

DROP TABLE IF EXISTS public.gym_sets CASCADE;
CREATE TABLE public.gym_sets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.gym_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  set_number  integer NOT NULL,
  reps        integer,
  weight_kg   numeric(6,2),
  duration_s  integer,   -- for timed exercises (planks, etc.)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gym_sets_session_idx ON public.gym_sets(session_id);
ALTER TABLE public.gym_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gym_sets_owner" ON public.gym_sets
  FOR ALL USING (session_id IN (SELECT id FROM public.gym_sessions WHERE user_id = auth.uid()));

-- ============================================================
-- TRAINING CALENDAR
-- ============================================================
DROP TABLE IF EXISTS public.calendar_events CASCADE;
CREATE TABLE public.calendar_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date   date NOT NULL,
  title        text NOT NULL,
  description  text,
  sport_type   text CHECK (sport_type IN ('skating','cycling','gym','rest','competition')),
  training_type text,
  duration_min integer,
  intensity    text CHECK (intensity IN ('low','medium','high','race')),
  completed    boolean DEFAULT false,
  session_id   uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX calendar_events_user_id_idx ON public.calendar_events(user_id);
CREATE INDEX calendar_events_date_idx    ON public.calendar_events(event_date);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_owner"   ON public.calendar_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY "calendar_creator" ON public.calendar_events FOR ALL USING (created_by = auth.uid());

-- ============================================================
-- VIDEO ANALYSIS
-- ============================================================
DROP TABLE IF EXISTS public.video_analyses CASCADE;
CREATE TABLE public.video_analyses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url    text NOT NULL,
  thumbnail_url text,
  title        text,
  analysis     text,         -- AI analysis result
  tags         text[],       -- ['salida','curva','tecnica']
  analyzed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_analyses_user_id_idx ON public.video_analyses(user_id);
ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_owner" ON public.video_analyses FOR ALL USING (user_id = auth.uid());
CREATE POLICY "video_coach" ON public.video_analyses FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE coach_id = auth.uid()));
