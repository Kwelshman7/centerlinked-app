-- Allow orgs to keep a facility in the database without showing it on the public org page.
-- Apply in Supabase SQL editor (or via migration runner).

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS hidden_from_org_page boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.facilities.hidden_from_org_page IS
  'When true, facility is omitted from the public organization profile grid. Facility record and direct links are retained.';

CREATE INDEX IF NOT EXISTS facilities_org_hidden_from_org_page_idx
  ON public.facilities (organization_id, hidden_from_org_page)
  WHERE verification_status = 'approved';
