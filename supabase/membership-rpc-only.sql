-- Membership and invites are SECURITY DEFINER RPC-only (audit P0 remainder).
-- Apply AFTER column-write-locks.sql.
-- Run: paste into Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/membership-rpc-only.sql
--
-- Rollback: restore snapshot policies "org members or super admin manage members"
-- and "org members manage invites"; drop create_org_invite / revoke_org_invite /
-- remove_org_member; revert is_org_facility_admin and claim_pending_org_invite
-- from org-join-requests.sql.

-- ---------------------------------------------------------------------------
-- 1) is_org_facility_admin: membership or super_admin (not stale profile org)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_facility_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = _org_id
      AND om.user_id = _user_id
      AND om.role_at_org = 'facility_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_facility_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_facility_admin(uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) claim_pending_org_invite: never grant facility_admin from a forged invite
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_pending_org_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  invite_row public.org_invites%ROWTYPE;
  role_to_grant text;
  inviter_is_admin boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('joined', false, 'reason', 'not_authenticated');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.organization_id IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('joined', false, 'reason', 'already_in_org');
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('joined', false, 'reason', 'no_email');
  END IF;

  SELECT * INTO invite_row
  FROM public.org_invites
  WHERE lower(email) = user_email AND status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF invite_row.id IS NULL THEN
    RETURN jsonb_build_object('joined', false, 'reason', 'no_invite');
  END IF;

  role_to_grant := lower(trim(coalesce(invite_row.role_at_org, 'bd_rep')));
  IF role_to_grant NOT IN ('bd_rep', 'facility_admin') THEN
    role_to_grant := 'bd_rep';
  END IF;

  IF role_to_grant = 'facility_admin' THEN
    inviter_is_admin := invite_row.invited_by IS NOT NULL AND (
      public.has_role(invite_row.invited_by, 'super_admin'::public.app_role)
      OR public.is_org_facility_admin(invite_row.organization_id, invite_row.invited_by)
    );
    IF NOT inviter_is_admin THEN
      role_to_grant := 'bd_rep';
    END IF;
  END IF;

  PERFORM public.link_user_to_organization(
    uid,
    invite_row.organization_id,
    role_to_grant,
    invite_row.invited_by
  );

  UPDATE public.org_invites
  SET status = 'accepted', accepted_at = now(), role_at_org = role_to_grant
  WHERE id = invite_row.id;

  UPDATE public.organization_join_requests
  SET status = 'approved', reviewed_at = now(), updated_at = now()
  WHERE user_id = uid AND organization_id = invite_row.organization_id AND status = 'pending';

  RETURN jsonb_build_object(
    'joined', true,
    'organization_id', invite_row.organization_id,
    'role_at_org', role_to_grant
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_org_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pending_org_invite() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) create / revoke invite
-- ---------------------------------------------------------------------------
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

  IF NOT public.is_org_facility_admin(_organization_id, uid) THEN
    RAISE EXCEPTION 'Only organization admins can invite members' USING ERRCODE = '42501';
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

  IF NOT public.is_org_facility_admin(invite_row.organization_id, uid) THEN
    RAISE EXCEPTION 'Only organization admins can revoke invites' USING ERRCODE = '42501';
  END IF;

  IF invite_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is not pending';
  END IF;

  DELETE FROM public.org_invites WHERE id = _invite_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_org_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_org_invite(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) remove_org_member (called from Members.tsx; was missing from repo SQL)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_org_member(
  _member_user_id uuid,
  _organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  member_role text;
  admin_count integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _member_user_id IS NULL OR _organization_id IS NULL THEN
    RAISE EXCEPTION 'member and organization are required';
  END IF;

  IF _member_user_id = uid THEN
    RAISE EXCEPTION 'You cannot remove yourself';
  END IF;

  IF NOT public.is_org_facility_admin(_organization_id, uid) THEN
    RAISE EXCEPTION 'Only organization admins can remove members' USING ERRCODE = '42501';
  END IF;

  SELECT om.role_at_org INTO member_role
  FROM public.organization_members om
  WHERE om.organization_id = _organization_id AND om.user_id = _member_user_id;

  IF member_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF member_role = 'facility_admin' THEN
    SELECT count(*) INTO admin_count
    FROM public.organization_members om
    WHERE om.organization_id = _organization_id AND om.role_at_org = 'facility_admin';

    IF admin_count <= 1 AND NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
      RAISE EXCEPTION 'Cannot remove the last organization admin';
    END IF;
  END IF;

  DELETE FROM public.organization_members
  WHERE organization_id = _organization_id AND user_id = _member_user_id;

  UPDATE public.profiles
  SET organization_id = NULL, updated_at = now()
  WHERE user_id = _member_user_id AND organization_id = _organization_id;

  DELETE FROM public.user_roles
  WHERE user_id = _member_user_id
    AND role IN ('facility_admin'::public.app_role, 'bd_rep'::public.app_role);
END;
$$;

REVOKE ALL ON FUNCTION public.remove_org_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_org_member(uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) RLS: SELECT only for members/invites (writes via SECURITY DEFINER)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth users view members" ON public.organization_members;
DROP POLICY IF EXISTS "org members or super admin manage members" ON public.organization_members;
DROP POLICY IF EXISTS "members view own org members" ON public.organization_members;

CREATE POLICY "members view own org members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "org members manage invites" ON public.org_invites;
DROP POLICY IF EXISTS "org members view org invites" ON public.org_invites;

CREATE POLICY "org members view org invites"
ON public.org_invites
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Keep email self-view of pending invites (claim UI / login).
DROP POLICY IF EXISTS "view own pending invites by email" ON public.org_invites;
CREATE POLICY "view own pending invites by email"
ON public.org_invites
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((
    SELECT users.email FROM auth.users WHERE users.id = auth.uid()
  )::text)
);
