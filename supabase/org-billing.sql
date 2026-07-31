-- Org-level Stripe billing fields for CenterLinked memberships.
-- Apply in Supabase SQL editor (or via migration runner).

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_price_id text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS setup_package text,
  ADD COLUMN IF NOT EXISTS billing_email text;

COMMENT ON COLUMN public.organizations.subscription_status IS
  'Stripe subscription status: none|trialing|active|past_due|canceled|incomplete|unpaid';

COMMENT ON COLUMN public.organizations.setup_package IS
  'self_serve | done_for_you (nullable until first checkout)';

CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_customer_id_uidx
  ON public.organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS organizations_stripe_subscription_id_idx
  ON public.organizations (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS organizations_subscription_status_idx
  ON public.organizations (subscription_status);

-- Billing columns are readable with existing org SELECT policies.
-- Writes happen only via service role from Stripe webhook / checkout APIs.
