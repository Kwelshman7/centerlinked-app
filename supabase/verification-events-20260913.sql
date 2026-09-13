-- Reusable verification audit trail. Additive. Does not invent timestamps
-- or treat facilities.contracts_verified_at as proof a payer was verified.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.verification_events;

CREATE TABLE IF NOT EXISTS public.verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  entity_type text NOT NULL
    CHECK (entity_type IN ('facility', 'insurance_contract', 'bd_contact', 'location')),
  entity_id uuid,
  action text NOT NULL
    CHECK (action IN (
      'confirmed',
      'updated',
      'recorded_unknown',
      'marked_self_pay',
      'assigned_contact',
      'verified_contact',
      'updated_location'
    )),
  method text,
  notes text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_events_facility_idx
  ON public.verification_events (facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verification_events_entity_idx
  ON public.verification_events (entity_type, created_at DESC);

ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members read verification events" ON public.verification_events;
CREATE POLICY "Org members read verification events"
  ON public.verification_events FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_id
        AND public.is_org_member(auth.uid(), f.organization_id)
    )
  );

DROP POLICY IF EXISTS "Org members insert verification events" ON public.verification_events;
CREATE POLICY "Org members insert verification events"
  ON public.verification_events FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_id
        AND public.is_org_member(auth.uid(), f.organization_id)
    )
  );

GRANT SELECT, INSERT ON public.verification_events TO authenticated, service_role;

COMMENT ON TABLE public.verification_events IS
  'Directory freshness audit. A logged event does not confirm insurance benefits or admission.';
