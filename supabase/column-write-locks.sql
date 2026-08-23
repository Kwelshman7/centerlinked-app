-- Column-level write locks for privileged fields (audit P0).
-- Apply AFTER stripe-webhook-events.sql (billing trigger pattern) and
-- save-facility-with-contracts.sql.
-- Run: paste into Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/column-write-locks.sql
--
-- Rollback: drop the triggers/functions named below. Super-admin facility
-- approval and org verified checkboxes keep working (has_role super_admin).
-- stampVerified must be deployed with stamp_facility_verified in the same release.
--
-- Emergency from Phase 0: freeze_stale_facilities is executable by anon and
-- currently freezes every facility. Revoke client EXECUTE immediately.

-- ---------------------------------------------------------------------------
-- 0) freeze_stale_facilities: service_role only (body replaced in Phase 8)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'freeze_stale_facilities'
      AND p.pronargs = 0
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.freeze_stale_facilities() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.freeze_stale_facilities() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.freeze_stale_facilities() TO service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Helper: SECURITY DEFINER RPCs run as postgres; PostgREST service_role
-- JWT is auth.role() = service_role. Authenticated clients match neither.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.db_session_is_privileged_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
      OR current_user IN ('postgres', 'supabase_admin');
$$;

REVOKE ALL ON FUNCTION public.db_session_is_privileged_writer() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- facilities: approval columns + freeze flag
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_facility_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  approval_changed boolean;
  freeze_changed boolean;
  preferred_changed boolean;
BEGIN
  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    approval_changed :=
      COALESCE(NEW.verification_status, 'pending'::public.verification_status)
        IS DISTINCT FROM 'pending'::public.verification_status
      OR NEW.verified_at IS NOT NULL
      OR NEW.verified_by IS NOT NULL
      OR NEW.rejection_reason IS NOT NULL;
    freeze_changed := COALESCE(NEW.verification_frozen, false) IS DISTINCT FROM false;
    preferred_changed :=
      COALESCE(NEW.preferred_provider, false) IS DISTINCT FROM false
      OR NEW.preferred_until IS NOT NULL;
  ELSE
    approval_changed :=
      NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason;
    freeze_changed := NEW.verification_frozen IS DISTINCT FROM OLD.verification_frozen;
    preferred_changed :=
      NEW.preferred_provider IS DISTINCT FROM OLD.preferred_provider
      OR NEW.preferred_until IS DISTINCT FROM OLD.preferred_until;
  END IF;

  IF freeze_changed THEN
    RAISE EXCEPTION 'facilities.verification_frozen is read-only'
      USING ERRCODE = '42501';
  END IF;

  IF approval_changed OR preferred_changed THEN
    IF public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
      RETURN NEW;
    END IF;
    IF preferred_changed AND NOT approval_changed THEN
      RAISE EXCEPTION 'Facility preferred-provider fields are read-only'
        USING ERRCODE = '42501';
    END IF;
    RAISE EXCEPTION 'Facility approval fields are read-only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_facility_privileged_columns ON public.facilities;
CREATE TRIGGER protect_facility_privileged_columns
  BEFORE INSERT OR UPDATE ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_facility_privileged_columns();

REVOKE ALL ON FUNCTION public.protect_facility_privileged_columns() FROM PUBLIC;

-- Monthly stamp: org members / super_admin clear freeze via SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.stamp_facility_verified(_facility_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  org_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _facility_id IS NULL THEN
    RAISE EXCEPTION 'facility_id is required';
  END IF;

  SELECT f.organization_id INTO org_id
  FROM public.facilities f
  WHERE f.id = _facility_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Facility not found';
  END IF;

  IF NOT (
    public.has_role(uid, 'super_admin'::public.app_role)
    OR public.is_org_member(uid, org_id)
  ) THEN
    RAISE EXCEPTION 'Not allowed to verify this facility' USING ERRCODE = '42501';
  END IF;

  UPDATE public.facilities
  SET
    contracts_verified_at = now(),
    contracts_verified_by = uid,
    verification_frozen = false,
    updated_at = now()
  WHERE id = _facility_id;
END;
$$;

REVOKE ALL ON FUNCTION public.stamp_facility_verified(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.stamp_facility_verified(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- organizations.verified
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_verified_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.verified IS NOT DISTINCT FROM OLD.verified THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND COALESCE(NEW.verified, false) = false THEN
    RETURN NEW;
  END IF;

  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'organizations.verified is read-only'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_verified_column ON public.organizations;
CREATE TRIGGER protect_organization_verified_column
  BEFORE INSERT OR UPDATE OF verified ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_verified_column();

REVOKE ALL ON FUNCTION public.protect_organization_verified_column() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- organization_members.role_at_org
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_member_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'organization_members writes must use RPCs'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role_at_org IS DISTINCT FROM OLD.role_at_org THEN
    RAISE EXCEPTION 'organization_members.role_at_org is read-only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_member_role ON public.organization_members;
CREATE TRIGGER protect_organization_member_role
  BEFORE INSERT OR UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_member_role();

REVOKE ALL ON FUNCTION public.protect_organization_member_role() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- org_invites.role_at_org
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_org_invite_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  role_val text;
BEGIN
  role_val := lower(trim(coalesce(NEW.role_at_org, '')));
  IF role_val NOT IN ('bd_rep', 'facility_admin') THEN
    RAISE EXCEPTION 'org_invites.role_at_org must be bd_rep or facility_admin'
      USING ERRCODE = '42501';
  END IF;
  NEW.role_at_org := role_val;

  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF role_val = 'facility_admin' THEN
    IF auth.uid() IS NULL
       OR NOT (
         public.has_role(auth.uid(), 'super_admin'::public.app_role)
         OR public.is_org_facility_admin(NEW.organization_id, auth.uid())
       ) THEN
      RAISE EXCEPTION 'Only organization admins can invite facility admins'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_org_invite_role ON public.org_invites;
CREATE TRIGGER protect_org_invite_role
  BEFORE INSERT OR UPDATE OF role_at_org, organization_id ON public.org_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_org_invite_role();

REVOKE ALL ON FUNCTION public.protect_org_invite_role() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- profiles.organization_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      RAISE EXCEPTION 'profiles.organization_id must be set by RPCs'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'profiles.organization_id is read-only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_organization_id ON public.profiles;
CREATE TRIGGER protect_profile_organization_id
  BEFORE INSERT OR UPDATE OF organization_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_organization_id();

REVOKE ALL ON FUNCTION public.protect_profile_organization_id() FROM PUBLIC;
