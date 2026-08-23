-- Let org members (including BD reps) invite / revoke BD-rep teammates.
-- Facility-admin invites stay admin-only (also enforced by protect_org_invite_role).
-- Apply after membership-rpc-only.sql. Paste into the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.create_org_invite(
  _organization_id uuid,
  _email text,
  _role_at_org text DEFAULT 'bd_rep'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  email_val text;
  role_val text;
  org_domain text;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  IF NOT (
    public.is_org_facility_admin(_organization_id, uid)
    OR public.is_org_member(uid, _organization_id)
  ) THEN
    RAISE EXCEPTION 'Only organization members can invite teammates' USING ERRCODE = '42501';
  END IF;

  email_val := lower(trim(coalesce(_email, '')));
  IF email_val = '' OR email_val !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(email_val) > 254 THEN
    RAISE EXCEPTION 'A valid work email is required';
  END IF;

  IF NOT public.is_email_auth_allowed(email_val) THEN
    RAISE EXCEPTION 'That email is not allowed to join CenterLinked';
  END IF;

  role_val := lower(trim(coalesce(_role_at_org, 'bd_rep')));
  IF role_val NOT IN ('bd_rep', 'facility_admin') THEN
    RAISE EXCEPTION 'Invite role must be bd_rep or facility_admin';
  END IF;

  IF role_val = 'facility_admin'
     AND NOT public.is_org_facility_admin(_organization_id, uid) THEN
    RAISE EXCEPTION 'Only organization admins can invite facility admins'
      USING ERRCODE = '42501';
  END IF;

  SELECT lower(nullif(trim(email_domain), '')) INTO org_domain
  FROM public.organizations
  WHERE id = _organization_id;

  IF org_domain IS NOT NULL AND split_part(email_val, '@', 2) <> org_domain THEN
    RAISE EXCEPTION 'Email must be on @%', org_domain;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.profiles p ON p.user_id = om.user_id
    WHERE om.organization_id = _organization_id
      AND lower(coalesce(p.email, '')) = email_val
  ) THEN
    RAISE EXCEPTION 'That person is already a member';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.org_invites
    WHERE organization_id = _organization_id
      AND lower(email) = email_val
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Already invited';
  END IF;

  INSERT INTO public.org_invites (
    organization_id, email, role_at_org, invited_by, status
  ) VALUES (
    _organization_id, email_val, role_val, uid, 'pending'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_org_invite(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_org_invite(uuid, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_org_invite(_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  invite_row public.org_invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO invite_row FROM public.org_invites WHERE id = _invite_id;
  IF invite_row.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF NOT (
    public.is_org_facility_admin(invite_row.organization_id, uid)
    OR public.is_org_member(uid, invite_row.organization_id)
  ) THEN
    RAISE EXCEPTION 'Only organization members can revoke invites' USING ERRCODE = '42501';
  END IF;

  IF invite_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is not pending';
  END IF;

  DELETE FROM public.org_invites WHERE id = _invite_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_org_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_org_invite(uuid) TO authenticated, service_role;
