-- Apply in Supabase SQL Editor before deploying the UI change.
-- Public organization-profile visibility is an organization-admin-only action.

CREATE OR REPLACE FUNCTION public.enforce_facility_visibility_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role and database maintenance jobs do not carry an auth context.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.hidden_from_org_page IS NOT DISTINCT FROM OLD.hidden_from_org_page THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.hidden_from_org_page = false THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'super_admin'::public.app_role)
     OR public.is_org_facility_admin(NEW.organization_id, auth.uid()) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only organization admins can change facility public visibility'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS facilities_visibility_admin_only ON public.facilities;
CREATE TRIGGER facilities_visibility_admin_only
BEFORE INSERT OR UPDATE OF hidden_from_org_page ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.enforce_facility_visibility_admin();

REVOKE ALL ON FUNCTION public.enforce_facility_visibility_admin() FROM PUBLIC;
