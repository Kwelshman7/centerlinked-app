-- Run in Supabase Dashboard → SQL Editor (or: npx supabase db query --linked -f supabase/email-signup-eligible.sql)
-- Members-only gate: signup / Google sign-in requires a pending org invite OR a verified org email domain.

CREATE OR REPLACE FUNCTION public.email_signup_eligible(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  em text := lower(trim(_email));
  dom text := split_part(em, '@', 2);
BEGIN
  IF em = '' OR dom = '' THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.org_invites
    WHERE lower(email) = em AND status = 'pending'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organizations
    WHERE lower(email_domain) = dom AND verified = true
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.email_signup_eligible(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_signup_eligible(text) TO anon, authenticated;
