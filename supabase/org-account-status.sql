-- Organization account lifecycle: active | suspended | archived
-- Run: npx supabase db query --linked -f supabase/org-account-status.sql
-- (or paste into Supabase SQL Editor)

-- ---------------------------------------------------------------------------
-- Enum + columns
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'org_account_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.org_account_status AS ENUM ('active', 'suspended', 'archived');
  END IF;
END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS account_status public.org_account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS account_status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_status_changed_by uuid,
  ADD COLUMN IF NOT EXISTS account_status_reason text;

COMMENT ON COLUMN public.organizations.account_status IS
  'active = normal; suspended = public offline + members read-only; archived = soft offboarding';

CREATE INDEX IF NOT EXISTS organizations_account_status_idx
  ON public.organizations (account_status);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_account_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_status public.org_account_status,
  to_status public.org_account_status NOT NULL,
  reason text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_account_events_org_created_idx
  ON public.organization_account_events (organization_id, created_at DESC);

ALTER TABLE public.organization_account_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_account_events_super_admin_select" ON public.organization_account_events;
CREATE POLICY "organization_account_events_super_admin_select"
ON public.organization_account_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.org_account_status_of(_org_id uuid)
RETURNS public.org_account_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT o.account_status FROM public.organizations o WHERE o.id = _org_id),
    'active'::public.org_account_status
  );
$$;

CREATE OR REPLACE FUNCTION public.org_is_publicly_visible(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = _org_id
      AND o.verified = true
      AND o.account_status = 'active'::public.org_account_status
  );
$$;

CREATE OR REPLACE FUNCTION public.org_allows_member_writes(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = _org_id
      AND o.account_status = 'active'::public.org_account_status
  );
$$;

REVOKE ALL ON FUNCTION public.org_account_status_of(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_is_publicly_visible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_allows_member_writes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.org_account_status_of(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.org_is_publicly_visible(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.org_allows_member_writes(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Super-admin status change RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_organization_account_status(
  _org_id uuid,
  _status public.org_account_status,
  _reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  prev public.org_account_status;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Super admin required' USING ERRCODE = '42501';
  END IF;

  IF _org_id IS NULL OR _status IS NULL THEN
    RAISE EXCEPTION 'organization id and status are required';
  END IF;

  SELECT o.account_status INTO prev
  FROM public.organizations o
  WHERE o.id = _org_id
  FOR UPDATE;

  IF prev IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  IF prev = _status THEN
    RETURN true;
  END IF;

  UPDATE public.organizations
  SET
    account_status = _status,
    account_status_changed_at = now(),
    account_status_changed_by = uid,
    account_status_reason = nullif(trim(coalesce(_reason, '')), ''),
    updated_at = now()
  WHERE id = _org_id;

  INSERT INTO public.organization_account_events (
    organization_id, from_status, to_status, reason, changed_by
  ) VALUES (
    _org_id, prev, _status, nullif(trim(coalesce(_reason, '')), ''), uid
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_organization_account_status(uuid, public.org_account_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_organization_account_status(uuid, public.org_account_status, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Organizations SELECT policies (public must be active)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "anon can view verified organizations" ON public.organizations;
CREATE POLICY "anon can view verified active organizations"
ON public.organizations
FOR SELECT
TO anon
USING (
  verified = true
  AND account_status = 'active'::public.org_account_status
);

DROP POLICY IF EXISTS "authenticated users view all orgs" ON public.organizations;
DROP POLICY IF EXISTS "authenticated view verified or member orgs" ON public.organizations;
CREATE POLICY "authenticated view active verified or member orgs"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    account_status = 'active'::public.org_account_status
    AND verified = true
  )
  OR (
    account_status = 'suspended'::public.org_account_status
    AND public.is_org_member(auth.uid(), id)
  )
);

-- Members may update only active orgs; super admin always can
DROP POLICY IF EXISTS "org members or super admin update org" ON public.organizations;
DROP POLICY IF EXISTS "org members update own org when active" ON public.organizations;
CREATE POLICY "org members or super admin update org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), id)
    AND account_status = 'active'::public.org_account_status
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), id)
    AND account_status = 'active'::public.org_account_status
  )
);

-- ---------------------------------------------------------------------------
-- Facilities: hide non-active org facilities from public discovery
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon can view approved facilities" ON public.facilities;
CREATE POLICY "anon can view approved facilities of active orgs"
ON public.facilities
FOR SELECT
TO anon
USING (
  verification_status = 'approved'::public.verification_status
  AND public.org_account_status_of(organization_id) = 'active'::public.org_account_status
);

DROP POLICY IF EXISTS "view approved facilities or own org" ON public.facilities;
CREATE POLICY "view approved active facilities or own org"
ON public.facilities
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    verification_status = 'approved'::public.verification_status
    AND public.org_account_status_of(organization_id) = 'active'::public.org_account_status
  )
  OR (
    public.is_org_member(auth.uid(), organization_id)
    AND public.org_account_status_of(organization_id) <> 'archived'::public.org_account_status
  )
);

DROP POLICY IF EXISTS "org members create facilities" ON public.facilities;
CREATE POLICY "org members create facilities when active"
ON public.facilities
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), organization_id)
    AND public.org_allows_member_writes(organization_id)
  )
);

DROP POLICY IF EXISTS "org members or super admin update facilities" ON public.facilities;
CREATE POLICY "org members or super admin update facilities"
ON public.facilities
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), organization_id)
    AND public.org_allows_member_writes(organization_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), organization_id)
    AND public.org_allows_member_writes(organization_id)
  )
);

DROP POLICY IF EXISTS "org members or super admin delete facilities" ON public.facilities;
CREATE POLICY "org members or super admin delete facilities"
ON public.facilities
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    public.is_org_member(auth.uid(), organization_id)
    AND public.org_allows_member_writes(organization_id)
  )
);

-- NOTE: Also apply the account-status write guards in
-- supabase/save-facility-with-contracts.sql (save_facility_with_contracts +
-- update_organization_profile) after this migration.
