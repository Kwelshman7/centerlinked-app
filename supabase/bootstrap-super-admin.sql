-- Run once in Supabase Dashboard → SQL Editor.
-- Replace YOUR_EMAIL@COMPANY.COM with the Google/work email you sign in with.

-- 1) Emails allowed to self-grant super_admin on login (via bootstrap_super_admin RPC)
CREATE TABLE IF NOT EXISTS public.bootstrap_admin_emails (
  email text PRIMARY KEY
);

-- Lock allowlist: only SECURITY DEFINER RPCs / service role may read or write.
ALTER TABLE public.bootstrap_admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.bootstrap_admin_emails (email)
VALUES (lower('YOUR_EMAIL@COMPANY.COM'))
ON CONFLICT (email) DO NOTHING;

-- 2) RPC called by the app after Google/email sign-in
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin()
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

  IF NOT EXISTS (
    SELECT 1 FROM public.bootstrap_admin_emails b WHERE b.email = user_email
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT uid, 'super_admin'::public.app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = uid AND ur.role = 'super_admin'::public.app_role
  );

  UPDATE public.organizations o
  SET verified = true, updated_at = now()
  FROM public.profiles p
  WHERE p.user_id = uid
    AND p.organization_id = o.id
    AND o.verified = false;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin() TO authenticated;

-- 3) One-shot grant (optional — use if you want immediate access before redeploying the app)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('YOUR_EMAIL@COMPANY.COM')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'super_admin'::public.app_role
  );

UPDATE public.organizations o
SET verified = true, updated_at = now()
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE lower(u.email) = lower('YOUR_EMAIL@COMPANY.COM')
  AND p.organization_id = o.id
  AND o.verified = false;
