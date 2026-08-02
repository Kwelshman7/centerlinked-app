-- Tighten overly broad SELECT policies discovered in the live RLS dump.
-- Run: npx supabase db query --linked -f supabase/rls-tenant-hardening.sql

-- ---------------------------------------------------------------------------
-- organizations: public/anon may only see verified orgs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon can view organizations" ON public.organizations;
CREATE POLICY "anon can view verified organizations"
ON public.organizations
FOR SELECT
TO anon
USING (verified = true);

DROP POLICY IF EXISTS "authenticated users view all orgs" ON public.organizations;
CREATE POLICY "authenticated view verified or member orgs"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  verified = true
  OR public.is_org_member(auth.uid(), id)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- ---------------------------------------------------------------------------
-- profiles: stop authenticated users from reading every profile
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth users view profiles" ON public.profiles;
CREATE POLICY "users view own org or admin profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (
    organization_id IS NOT NULL
    AND public.is_org_member(auth.uid(), organization_id)
  )
);
