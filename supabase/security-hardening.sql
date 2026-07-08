-- Run in Supabase Dashboard → SQL Editor AFTER bootstrap-super-admin.sql.
-- Adds critical RLS hardening and removes client-side bootstrap email exposure.

-- ---------------------------------------------------------------------------
-- 1) Lock bootstrap_admin_emails (server-only allowlist)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bootstrap_admin_emails ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated/anon.
-- Only postgres/service_role and SECURITY DEFINER functions may access this table.

-- ---------------------------------------------------------------------------
-- 2) Prevent authenticated users from self-granting super_admin
--    (bootstrap_super_admin SECURITY DEFINER bypasses RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_no_self_super_admin" ON public.user_roles;
CREATE POLICY "user_roles_no_self_super_admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role <> 'super_admin'::public.app_role
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 3) early_access_leads — public insert only, admin read
-- ---------------------------------------------------------------------------
ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "early_access_leads_public_insert" ON public.early_access_leads;
CREATE POLICY "early_access_leads_public_insert"
ON public.early_access_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "early_access_leads_admin_select" ON public.early_access_leads;
CREATE POLICY "early_access_leads_admin_select"
ON public.early_access_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4) organization_claims — authenticated insert own, admin review
-- ---------------------------------------------------------------------------
ALTER TABLE public.organization_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_claims_insert_authenticated" ON public.organization_claims;
CREATE POLICY "organization_claims_insert_authenticated"
ON public.organization_claims
FOR INSERT
TO authenticated
WITH CHECK (claimant_user_id = auth.uid() OR claimant_user_id IS NULL);

DROP POLICY IF EXISTS "organization_claims_select_own_or_admin" ON public.organization_claims;
CREATE POLICY "organization_claims_select_own_or_admin"
ON public.organization_claims
FOR SELECT
TO authenticated
USING (
  claimant_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "organization_claims_admin_update" ON public.organization_claims;
CREATE POLICY "organization_claims_admin_update"
ON public.organization_claims
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 5) RPC: check bootstrap candidacy without exposing allowlist to the client
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_candidate()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.bootstrap_admin_emails b WHERE b.email = user_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_bootstrap_admin_candidate() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bootstrap_admin_candidate() TO authenticated;
