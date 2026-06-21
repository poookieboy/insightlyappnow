
-- Prevent the same M-Pesa code from being submitted twice (across all users)
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_mpesa_code_unique
  ON public.subscriptions (upper(mpesa_code))
  WHERE mpesa_code IS NOT NULL;

-- Auto-verify: pattern check + uniqueness + immediate activation.
-- A background process / admin can later flip status to 'rejected' if Daraja disputes it.
CREATE OR REPLACE FUNCTION public.submit_mpesa_payment(
  p_plan text,
  p_code text
) RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_amount numeric;
  v_days int;
  v_existing_until timestamptz;
  v_start timestamptz;
  v_row public.subscriptions;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_plan = 'monthly' THEN
    v_amount := 150; v_days := 30;
  ELSIF p_plan = 'yearly' THEN
    v_amount := 1500; v_days := 365;
  ELSE
    RAISE EXCEPTION 'Invalid plan' USING ERRCODE = '22023';
  END IF;

  IF v_code !~ '^[A-Z0-9]{8,12}$' THEN
    RAISE EXCEPTION 'Invalid M-Pesa code format' USING ERRCODE = '22023';
  END IF;

  -- Reuse check
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE upper(mpesa_code) = v_code) THEN
    RAISE EXCEPTION 'This M-Pesa code has already been used' USING ERRCODE = '23505';
  END IF;

  -- Stack on top of existing pro time if still active
  SELECT pro_until INTO v_existing_until
  FROM public.user_subscription_status WHERE user_id = v_uid;
  v_start := GREATEST(COALESCE(v_existing_until, now()), now());

  INSERT INTO public.subscriptions (user_id, plan, amount, mpesa_code, status, expires_at, reviewed_at)
  VALUES (v_uid, p_plan, v_amount, v_code, 'approved', v_start + (v_days || ' days')::interval, now())
  RETURNING * INTO v_row;

  UPDATE public.user_subscription_status
     SET tier = 'pro',
         pro_until = v_row.expires_at,
         provider = 'mpesa',
         updated_at = now()
   WHERE user_id = v_uid;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mpesa_payment(text, text) TO authenticated;
