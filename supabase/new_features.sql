-- ============================================================
-- WHEELS (Ruedas / Equipamiento)
-- ============================================================
DROP TABLE IF EXISTS public.wheels CASCADE;
CREATE TABLE public.wheels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand         text NOT NULL,
  model         text,
  hardness      text,         -- e.g. '84A', '86A'
  size_mm       integer,      -- e.g. 80, 84, 90, 100, 110
  color         text,
  km_limit      integer DEFAULT 500,
  km_used       numeric(8,2) DEFAULT 0,
  is_active     boolean DEFAULT true,
  notes         text,
  purchased_at  date,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wheels_user_id_idx ON public.wheels(user_id);
ALTER TABLE public.wheels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wheels_owner" ON public.wheels FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- GOALS (Metas)
-- ============================================================
DROP TABLE IF EXISTS public.goals CASCADE;
CREATE TABLE public.goals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  sport_type   text CHECK (sport_type IN ('skating','cycling','gym','all')),
  metric       text NOT NULL CHECK (metric IN ('sessions','distance_km','duration_minutes','calories','points')),
  target_value numeric(10,2) NOT NULL,
  current_value numeric(10,2) DEFAULT 0,
  period       text NOT NULL CHECK (period IN ('weekly','monthly','yearly','custom')),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed','cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_user_id_idx ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_owner" ON public.goals FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- ACHIEVEMENTS / BADGES (Logros)
-- ============================================================
DROP TABLE IF EXISTS public.achievements CASCADE;
CREATE TABLE public.achievements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key    text NOT NULL,   -- e.g. 'first_session', 'km_100', 'streak_7'
  title        text NOT NULL,
  description  text,
  icon         text NOT NULL,   -- emoji
  earned_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX achievements_user_id_idx ON public.achievements(user_id);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_owner" ON public.achievements FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- WELLNESS LOGS (Bienestar Diario)
-- ============================================================
DROP TABLE IF EXISTS public.wellness_logs CASCADE;
CREATE TABLE public.wellness_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date      date NOT NULL,
  sleep_hours   numeric(4,1),
  sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 5),
  fatigue       integer CHECK (fatigue BETWEEN 1 AND 5),
  hydration     integer CHECK (hydration BETWEEN 1 AND 5),
  mood          integer CHECK (mood BETWEEN 1 AND 5),
  stress        integer CHECK (stress BETWEEN 1 AND 5),
  muscle_soreness integer CHECK (muscle_soreness BETWEEN 1 AND 5),
  resting_hr    integer,
  weight_kg     numeric(5,2),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);
CREATE INDEX wellness_logs_user_id_idx ON public.wellness_logs(user_id);
CREATE INDEX wellness_logs_date_idx   ON public.wellness_logs(log_date);
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wellness_owner" ON public.wellness_logs FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- MESSAGES (Mensajería Coach ↔ Atleta)
-- ============================================================
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_sender_idx   ON public.messages(sender_id);
CREATE INDEX messages_receiver_idx ON public.messages(receiver_id);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participant" ON public.messages
  FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================
-- SESSION COMMENTS (Comentarios del Coach en sesiones)
-- ============================================================
DROP TABLE IF EXISTS public.session_comments CASCADE;
CREATE TABLE public.session_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX session_comments_session_idx ON public.session_comments(session_id);
ALTER TABLE public.session_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_visible" ON public.session_comments FOR SELECT USING (true);
CREATE POLICY "comments_author"  ON public.session_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete"  ON public.session_comments FOR DELETE USING (author_id = auth.uid());
