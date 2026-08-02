
-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('subscription','sponsorship')),
  plan text,
  sponsor_level text,
  provider text NOT NULL DEFAULT 'lipalink',
  transaction_id text,
  provider_reference text,
  phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','cancelled')),
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_txn_unique ON public.payments (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SPONSORS
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  sponsor_level text NOT NULL DEFAULT 'custom',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','success','failed','cancelled')),
  transaction_id text,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsors_user_idx ON public.sponsors (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sponsors_txn_idx ON public.sponsors (transaction_id);

GRANT SELECT ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sponsorships" ON public.sponsors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all sponsorships" ON public.sponsors
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUBSCRIPTIONS EXTENSION
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'mpesa',
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions ALTER COLUMN mpesa_code DROP NOT NULL;
CREATE INDEX IF NOT EXISTS subscriptions_txn_idx ON public.subscriptions (transaction_id);
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.user_subscription_status TO service_role;
