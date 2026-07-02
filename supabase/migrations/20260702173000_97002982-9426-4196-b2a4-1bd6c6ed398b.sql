
ALTER TABLE public.user_subscription_status DROP CONSTRAINT IF EXISTS user_subscription_status_provider_check;
ALTER TABLE public.user_subscription_status ADD CONSTRAINT user_subscription_status_provider_check CHECK (provider = ANY (ARRAY['stripe'::text, 'mpesa'::text, 'grant'::text]));

DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users WHERE lower(email) IN ('khybastan@gmail.com','uelezen3@gmail.com') LOOP
    INSERT INTO public.user_subscription_status (user_id, tier, pro_until, provider, trial_started_at, trial_ends_at)
    VALUES (u.id, 'pro', '2099-12-31'::timestamptz, 'grant', now(), now() + interval '7 days')
    ON CONFLICT (user_id) DO UPDATE SET tier='pro', pro_until='2099-12-31'::timestamptz, provider='grant', updated_at=now();
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.grant_infinite_pro_if_allowlisted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) IN ('khybastan@gmail.com','uelezen3@gmail.com') THEN
    INSERT INTO public.user_subscription_status (user_id, tier, pro_until, provider, trial_started_at, trial_ends_at)
    VALUES (NEW.id, 'pro', '2099-12-31'::timestamptz, 'grant', now(), now() + interval '7 days')
    ON CONFLICT (user_id) DO UPDATE SET tier='pro', pro_until='2099-12-31'::timestamptz, provider='grant', updated_at=now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_pro ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_pro AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_infinite_pro_if_allowlisted();

CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content_html TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT ALL ON public.user_notes TO service_role;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notes_select" ON public.user_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_notes_insert" ON public.user_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notes_update" ON public.user_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notes_delete" ON public.user_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_curriculum_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curriculum, grade, subject, topic)
);
GRANT SELECT ON public.ai_curriculum_notes TO authenticated;
GRANT ALL ON public.ai_curriculum_notes TO service_role;
ALTER TABLE public.ai_curriculum_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_curriculum_notes" ON public.ai_curriculum_notes FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_ai_curriculum_notes_updated_at BEFORE UPDATE ON public.ai_curriculum_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  difficulty TEXT,
  estimated_minutes INT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  mcq_score INT,
  mcq_total INT,
  written_scores JSONB,
  feedback JSONB,
  time_spent_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_attempts_select" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_attempts_insert" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_attempts_update" ON public.quiz_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_attempts_delete" ON public.quiz_attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
