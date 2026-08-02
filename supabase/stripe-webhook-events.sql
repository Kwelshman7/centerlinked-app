-- Stripe webhook event ledger + org billing column protection.
-- Run in Supabase SQL Editor (or: npx supabase db query --linked -f supabase/stripe-webhook-events.sql)

-- ---------------------------------------------------------------------------
-- 1) Idempotent webhook processing ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  livemode boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated — service_role only (bypasses RLS).
REVOKE ALL ON TABLE public.stripe_webhook_events FROM PUBLIC;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Prevent clients from forging Stripe billing fields on organizations
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- PostgREST service_role and DB owners may write billing fields.
  IF coalesce(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_price_id IS DISTINCT FROM OLD.subscription_price_id
     OR NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end
     OR NEW.setup_package IS DISTINCT FROM OLD.setup_package
     OR NEW.billing_email IS DISTINCT FROM OLD.billing_email THEN
    RAISE EXCEPTION 'Organization billing fields are read-only';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_billing_columns ON public.organizations;
CREATE TRIGGER protect_organization_billing_columns
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_billing_columns();
