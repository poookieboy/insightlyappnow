
-- 1. user_subscription_status
CREATE TABLE public.user_subscription_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial','pro','expired')),
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  pro_until timestamptz,
  provider text CHECK (provider IN ('stripe','mpesa')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_subscription_status TO authenticated;
GRANT ALL ON public.user_subscription_status TO service_role;

ALTER TABLE public.user_subscription_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.user_subscription_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions status"
  ON public.user_subscription_status FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update subscription status"
  ON public.user_subscription_status FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_subscription_status_updated_at
  BEFORE UPDATE ON public.user_subscription_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. legal_acceptances
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tos_version text NOT NULL,
  privacy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own acceptances"
  ON public.legal_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Extend handle_new_user to start trial automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_subscription_status (user_id, tier, trial_started_at, trial_ends_at)
  VALUES (NEW.id, 'trial', now(), now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Ensure trigger on auth.users exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 4. Backfill trial rows for existing users without one
INSERT INTO public.user_subscription_status (user_id, tier, trial_started_at, trial_ends_at)
SELECT u.id, 'trial', now(), now() + interval '7 days'
FROM auth.users u
LEFT JOIN public.user_subscription_status s ON s.user_id = u.id
WHERE s.user_id IS NULL;
