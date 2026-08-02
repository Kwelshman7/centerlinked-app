-- Personal emails are blocked for login/signup unless explicitly approved.
-- Run in Supabase SQL Editor (or: npx supabase db query --linked -f supabase/approved-personal-emails.sql)

-- ---------------------------------------------------------------------------
-- Allowlist of personal emails approved by a super admin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approved_personal_emails (
  email text PRIMARY KEY,
  notes text,
  approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approved_personal_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved_personal_emails_admin_select" ON public.approved_personal_emails;
CREATE POLICY "approved_personal_emails_admin_select"
ON public.approved_personal_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "approved_personal_emails_admin_insert" ON public.approved_personal_emails;
CREATE POLICY "approved_personal_emails_admin_insert"
ON public.approved_personal_emails
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "approved_personal_emails_admin_delete" ON public.approved_personal_emails;
CREATE POLICY "approved_personal_emails_admin_delete"
ON public.approved_personal_emails
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "approved_personal_emails_admin_update" ON public.approved_personal_emails;
CREATE POLICY "approved_personal_emails_admin_update"
ON public.approved_personal_emails
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- Domain helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_personal_email_domain(_email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  dom text := lower(split_part(trim(_email), '@', 2));
BEGIN
  IF dom = '' THEN
    RETURN false;
  END IF;

  RETURN dom = ANY (ARRAY[
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'ymail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'pm.me',
    'mail.com',
    'gmx.com',
    'zoho.com',
    'yandex.com',
    'fastmail.com',
    'tutanota.com',
    'duck.com'
  ]);
END;
$$;

REVOKE ALL ON FUNCTION public.is_personal_email_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_personal_email_domain(text) TO anon, authenticated;

-- True when the email may sign in / sign up (company domain, approved personal, or bootstrap admin).
CREATE OR REPLACE FUNCTION public.is_email_auth_allowed(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  em text := lower(trim(_email));
BEGIN
  IF em = '' OR position('@' in em) = 0 THEN
    RETURN false;
  END IF;

  -- Company / non-personal domains are always allowed.
  IF NOT public.is_personal_email_domain(em) THEN
    RETURN true;
  END IF;

  -- Explicit personal-email exceptions.
  IF EXISTS (
    SELECT 1 FROM public.approved_personal_emails a WHERE a.email = em
  ) THEN
    RETURN true;
  END IF;

  -- Bootstrap super-admin allowlist (server-only table).
  IF EXISTS (
    SELECT 1 FROM public.bootstrap_admin_emails b WHERE b.email = em
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_email_auth_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_auth_allowed(text) TO anon, authenticated;

-- Approve helper used when approving access requests.
CREATE OR REPLACE FUNCTION public.approve_personal_email(_email text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  em text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only super admins can approve personal emails';
  END IF;

  IF em = '' OR NOT public.is_personal_email_domain(em) THEN
    RETURN;
  END IF;

  INSERT INTO public.approved_personal_emails (email, notes, approved_by)
  VALUES (em, NULLIF(trim(COALESCE(_notes, '')), ''), auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET notes = COALESCE(EXCLUDED.notes, public.approved_personal_emails.notes),
        approved_by = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.approve_personal_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_personal_email(text, text) TO authenticated;
