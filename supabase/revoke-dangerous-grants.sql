-- CRITICAL: revoke overly broad EXECUTE grants discovered in production audit.
-- Run: npx supabase db query --linked -f supabase/revoke-dangerous-grants.sql

-- ---------------------------------------------------------------------------
-- run_sql: arbitrary SQL execution must never be callable by clients
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.run_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_sql(text) FROM anon, authenticated;
-- Keep service_role only if the function must remain for internal tooling.
-- Prefer dropping it entirely in production once unused.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'run_sql'
  ) THEN
    -- Leave EXECUTE for service_role/postgres only (default owner privileges).
    NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Privileged org linking: never allow anonymous callers
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.link_user_to_organization(uuid, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_user_to_organization(uuid, uuid, text, uuid) FROM anon;
-- Authenticated should not call this directly either; membership flows use
-- dedicated SECURITY DEFINER RPCs. Revoke client access.
REVOKE ALL ON FUNCTION public.link_user_to_organization(uuid, uuid, text, uuid) FROM authenticated;

-- ---------------------------------------------------------------------------
-- Facility/org write RPCs: authenticated only (auth.uid() required)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.save_facility_with_contracts(uuid, jsonb, jsonb, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_facility_with_contracts(uuid, jsonb, jsonb, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_facility_with_contracts(uuid, jsonb, jsonb, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.update_organization_profile(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_organization_profile(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_organization_profile(uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- Email auth helpers: keep callable for login gates (anon + authenticated)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_email_auth_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_auth_allowed(text) TO anon, authenticated, service_role;
