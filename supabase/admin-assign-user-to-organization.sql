-- Super-admin only: attach an existing user to an org, or leave a pending
-- invite that claim_pending_org_invite will consume on first login.
-- Bypasses the org email-domain check so approved personal emails can be
-- made facility_admin (Access Requests → Assign).

CREATE OR REPLACE FUNCTION public.admin_assign_user_to_organization(
  _email text,
  _organization_id uuid,
  _role_at_org text DEFAULT 'facility_admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  email_val text;
  role_val text;
  target_user uuid;
  invite_id uuid;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only super admins can assign users to organizations' USING ERRCODE = '42501';
  END IF;

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = _organization_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  email_val := lower(trim(coalesce(_email, '')));
  IF email_val = '' OR email_val !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(email_val) > 254 THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF NOT public.is_email_auth_allowed(email_val) THEN
    RAISE EXCEPTION 'That email is not allowed to join CenterLinked. Approve the personal email first.';
  END IF;

  role_val := lower(trim(coalesce(_role_at_org, 'facility_admin')));
  IF role_val NOT IN ('bd_rep', 'facility_admin') THEN
    RAISE EXCEPTION 'Role must be bd_rep or facility_admin';
  END IF;

  SELECT p.user_id INTO target_user
  FROM public.profiles p
  WHERE lower(coalesce(p.email, '')) = email_val
  LIMIT 1;

  IF target_user IS NULL THEN
    SELECT u.id INTO target_user
    FROM auth.users u
    WHERE lower(u.email) = email_val
    LIMIT 1;
  END IF;

  IF target_user IS NOT NULL THEN
    PERFORM public.link_user_to_organization(target_user, _organization_id, role_val, uid);

    UPDATE public.org_invites
    SET status = 'accepted', accepted_at = now()
    WHERE organization_id = _organization_id
      AND lower(email) = email_val
      AND status = 'pending';

    RETURN jsonb_build_object(
      'linked', true,
      'invited', false,
      'user_id', target_user,
      'role_at_org', role_val
    );
  END IF;

  SELECT id INTO invite_id
  FROM public.org_invites
  WHERE organization_id = _organization_id
    AND lower(email) = email_val
    AND status = 'pending'
  LIMIT 1;

  IF invite_id IS NULL THEN
    INSERT INTO public.org_invites (organization_id, email, role_at_org, invited_by, status)
    VALUES (_organization_id, email_val, role_val, uid, 'pending')
    RETURNING id INTO invite_id;
  END IF;

  RETURN jsonb_build_object(
    'linked', false,
    'invited', true,
    'invite_id', invite_id,
    'role_at_org', role_val
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_user_to_organization(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_assign_user_to_organization(text, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_user_to_organization(text, uuid, text) TO authenticated, service_role;
