-- Search demand going forward. Does not invent historical demand.
-- Rollback: DROP TABLE IF EXISTS public.search_events;

CREATE TABLE IF NOT EXISTS public.search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_name text,
  plan_type text,
  state text,
  city text,
  zip text,
  loc text,
  specialty text,
  accreditation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_events_created_idx
  ON public.search_events (created_at DESC);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated record search events" ON public.search_events;
CREATE POLICY "Authenticated record search events"
  ON public.search_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Super admins read search events" ON public.search_events;
CREATE POLICY "Super admins read search events"
  ON public.search_events FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

GRANT SELECT, INSERT ON public.search_events TO authenticated, service_role;

COMMENT ON TABLE public.search_events IS
  'Forward-looking search filters only. Historical demand was not backfilled.';
