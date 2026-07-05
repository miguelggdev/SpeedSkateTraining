-- Official distances and personal bests
DROP TABLE IF EXISTS public.race_times CASCADE;
CREATE TABLE public.race_times (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_m    integer NOT NULL,        -- 100, 200, 300, 500, 1000, 1500, 3000, 5000, 10000, 42195
  time_ms       integer NOT NULL,        -- milliseconds
  track_type    text CHECK (track_type IN ('track_200','track_400','open_road')),
  competition   boolean DEFAULT false,   -- official race vs training
  event_name    text,                    -- e.g. "Campeonato Nacional 2024"
  location      text,
  session_id    uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  is_pb         boolean DEFAULT false,   -- is this the current personal best?
  notes         text,
  recorded_at   date NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX race_times_user_id_idx     ON public.race_times(user_id);
CREATE INDEX race_times_distance_idx    ON public.race_times(distance_m);
CREATE INDEX race_times_recorded_at_idx ON public.race_times(recorded_at);
ALTER TABLE public.race_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "race_times_owner"  ON public.race_times FOR ALL   USING (user_id = auth.uid());
CREATE POLICY "race_times_coach"  ON public.race_times FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE coach_id = auth.uid()));

-- Lap splits for track sessions
DROP TABLE IF EXISTS public.lap_splits CASCADE;
CREATE TABLE public.lap_splits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lap_number  integer NOT NULL,
  lap_time_ms integer NOT NULL,          -- lap time in ms
  split_ms    integer NOT NULL,          -- cumulative time in ms
  distance_m  integer NOT NULL,          -- distance completed at this split
  speed_kmh   numeric(5,2),
  hr_bpm      integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lap_splits_session_idx ON public.lap_splits(session_id);
ALTER TABLE public.lap_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lap_splits_owner" ON public.lap_splits FOR ALL USING (user_id = auth.uid());
CREATE POLICY "lap_splits_coach" ON public.lap_splits FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE coach_id = auth.uid()));
