-- Apply this migration before deploying the server-side access-request intake.
-- It removes anonymous direct writes and creates a durable, non-PII rate-limit ledger.

ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_leads
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
DROP POLICY IF EXISTS "early_access_leads_public_insert" ON public.early_access_leads;
DROP POLICY IF EXISTS "anyone submits leads" ON public.early_access_leads;

REVOKE INSERT ON TABLE public.early_access_leads FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.access_request_rate_limits (
  fingerprint text PRIMARY KEY CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_request_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_access_request_rate_limit(
  _fingerprint text,
  _max_attempts integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_attempts integer;
BEGIN
  IF _fingerprint !~ '^[a-f0-9]{64}$'
    OR _max_attempts < 1 OR _max_attempts > 100
    OR _window_seconds < 60 OR _window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit arguments';
  END IF;

  INSERT INTO public.access_request_rate_limits AS limits (fingerprint, window_started_at, attempts, updated_at)
  VALUES (_fingerprint, now(), 1, now())
  ON CONFLICT (fingerprint) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - make_interval(secs => _window_seconds) THEN now()
      ELSE limits.window_started_at
    END,
    attempts = CASE
      WHEN limits.window_started_at <= now() - make_interval(secs => _window_seconds) THEN 1
      ELSE limits.attempts + 1
    END,
    updated_at = now()
  RETURNING attempts INTO current_attempts;

  RETURN current_attempts <= _max_attempts;
END;
$$;

REVOKE ALL ON TABLE public.access_request_rate_limits FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_access_request_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_access_request_rate_limit(text, integer, integer) TO service_role;
