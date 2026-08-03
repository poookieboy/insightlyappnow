-- 1. Referral code on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..7 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.gen_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

-- 2. Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  code_used text NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view referrals they made"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Admins view all referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Rewards
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone int NOT NULL,
  hours int NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone)
);

GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rewards"
  ON public.referral_rewards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all rewards"
  ON public.referral_rewards FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Public validity check (leaks nothing but validity)
CREATE OR REPLACE FUNCTION public.referral_code_valid(p_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE referral_code = upper(trim(p_code))
  );
$$;

GRANT EXECUTE ON FUNCTION public.referral_code_valid(text) TO anon, authenticated;

-- 5. Claim referral (called by the referred user after email verification)
CREATE OR REPLACE FUNCTION public.claim_referral(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_referrer uuid;
  v_confirmed boolean;
  v_count int;
  v_milestone int;
  v_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT (email_confirmed_at IS NOT NULL) INTO v_confirmed FROM auth.users WHERE id = v_uid;
  IF NOT COALESCE(v_confirmed, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'verify_email');
  END IF;

  IF v_code !~ '^[A-Z0-9]{5,12}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT user_id INTO v_referrer FROM public.profiles WHERE referral_code = v_code;
  IF v_referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_referrer = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_referral');
  END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_referred');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_user_id, code_used)
  VALUES (v_referrer, v_uid, v_code);

  UPDATE public.profiles SET referred_by = v_referrer WHERE user_id = v_uid;

  SELECT count(*) INTO v_count FROM public.referrals WHERE referrer_id = v_referrer;
  v_milestone := (v_count / 4) * 4;

  IF v_milestone >= 4 AND NOT EXISTS (
    SELECT 1 FROM public.referral_rewards WHERE user_id = v_referrer AND milestone = v_milestone
  ) THEN
    INSERT INTO public.referral_rewards (user_id, milestone, hours) VALUES (v_referrer, v_milestone, 24);

    SELECT pro_until INTO v_until FROM public.user_subscription_status WHERE user_id = v_referrer;
    v_until := GREATEST(COALESCE(v_until, now()), now()) + interval '24 hours';

    UPDATE public.user_subscription_status
       SET tier = 'pro', pro_until = v_until, provider = COALESCE(provider, 'referral'), updated_at = now()
     WHERE user_id = v_referrer;
  END IF;

  RETURN jsonb_build_object('ok', true, 'referrals', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;