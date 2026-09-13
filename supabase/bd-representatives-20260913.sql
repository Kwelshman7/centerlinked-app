-- Reusable BD representatives + facility assignments.
-- Additive. Copies existing facility.bd_contact_* values; does not invent contacts.
-- Denormalized facility.bd_contact_* remains the public-sheet primary.
--
-- Rollback:
--   ALTER TABLE public.facilities
--     DROP COLUMN IF EXISTS bd_contact_title,
--     DROP COLUMN IF EXISTS bd_contact_verified_at,
--     DROP COLUMN IF EXISTS bd_contact_verified_by;
--   DROP TABLE IF EXISTS public.facility_bd_assignments;
--   DROP TABLE IF EXISTS public.bd_representatives;

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS bd_contact_title text,
  ADD COLUMN IF NOT EXISTS bd_contact_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS bd_contact_verified_by uuid;

CREATE TABLE IF NOT EXISTS public.bd_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  title text,
  organization_name text,
  email text,
  phone text,
  territory text,
  states_covered text[] NOT NULL DEFAULT '{}',
  payer_expertise text[] NOT NULL DEFAULT '{}',
  preferred_contact_method text
    CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('phone', 'email', 'text')),
  availability_status text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'limited', 'unavailable')),
  avatar_url text,
  last_verified_at timestamptz,
  verified_by uuid,
  verification_method text,
  internal_notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facility_bd_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  representative_id uuid NOT NULL REFERENCES public.bd_representatives(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, representative_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS facility_bd_assignments_one_primary_idx
  ON public.facility_bd_assignments (facility_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS bd_representatives_email_idx
  ON public.bd_representatives (lower(email))
  WHERE email IS NOT NULL;

ALTER TABLE public.bd_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_bd_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members read BD representatives" ON public.bd_representatives;
CREATE POLICY "Org members read BD representatives"
  ON public.bd_representatives FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR organization_id IS NULL
    OR public.is_org_member(auth.uid(), organization_id)
    OR (active = true AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Super admins manage BD representatives" ON public.bd_representatives;
CREATE POLICY "Super admins manage BD representatives"
  ON public.bd_representatives FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Org members read BD assignments" ON public.facility_bd_assignments;
CREATE POLICY "Org members read BD assignments"
  ON public.facility_bd_assignments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_id
        AND (
          public.is_org_member(auth.uid(), f.organization_id)
          OR (f.verification_status = 'approved' AND auth.uid() IS NOT NULL)
        )
    )
  );

DROP POLICY IF EXISTS "Super admins manage BD assignments" ON public.facility_bd_assignments;
CREATE POLICY "Super admins manage BD assignments"
  ON public.facility_bd_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bd_representatives TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facility_bd_assignments TO authenticated, service_role;

DROP POLICY IF EXISTS "Org members manage own BD representatives" ON public.bd_representatives;
CREATE POLICY "Org members manage own BD representatives"
  ON public.bd_representatives FOR ALL
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(auth.uid(), organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "Org members manage BD assignments" ON public.facility_bd_assignments;
CREATE POLICY "Org members manage BD assignments"
  ON public.facility_bd_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_id
        AND public.is_org_member(auth.uid(), f.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_id
        AND public.is_org_member(auth.uid(), f.organization_id)
    )
  );

-- Copy existing named BD contacts into reusable rows. Do not invent emails or phones.
INSERT INTO public.bd_representatives (organization_id, full_name, email, phone, organization_name)
SELECT DISTINCT ON (f.organization_id, lower(btrim(f.bd_contact_name)), lower(coalesce(f.bd_contact_email, '')))
  f.organization_id,
  btrim(f.bd_contact_name),
  nullif(lower(btrim(f.bd_contact_email)), ''),
  nullif(btrim(f.bd_contact_phone), ''),
  o.name
FROM public.facilities f
JOIN public.organizations o ON o.id = f.organization_id
WHERE nullif(btrim(f.bd_contact_name), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.bd_representatives r
    WHERE r.organization_id = f.organization_id
      AND lower(r.full_name) = lower(btrim(f.bd_contact_name))
      AND coalesce(lower(r.email), '') = lower(coalesce(nullif(btrim(f.bd_contact_email), ''), ''))
  );

INSERT INTO public.facility_bd_assignments (facility_id, representative_id, is_primary)
SELECT f.id, r.id, true
FROM public.facilities f
JOIN public.bd_representatives r
  ON r.organization_id = f.organization_id
 AND lower(r.full_name) = lower(btrim(f.bd_contact_name))
 AND coalesce(lower(r.email), '') = lower(coalesce(nullif(btrim(f.bd_contact_email), ''), ''))
WHERE nullif(btrim(f.bd_contact_name), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.facility_bd_assignments a
    WHERE a.facility_id = f.id AND a.representative_id = r.id
  );

COMMENT ON TABLE public.bd_representatives IS
  'Reusable BD people. Internal notes are never selected on public sheets.';
COMMENT ON COLUMN public.facilities.bd_contact_title IS
  'Denormalized primary BD title for public/search display.';
