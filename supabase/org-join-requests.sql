-- Domain-matched org join requests + invite auto-claim.
-- Run in Supabase Dashboard → SQL Editor (after email-signup-eligible.sql).

-- ---------------------------------------------------------------------------
-- 1) Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  email_domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  role_at_org text NOT NULL DEFAULT 'bd_rep',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_join_requests_org_status_idx
  ON public.organization_join_requests (organization_id, status);

CREATE INDEX IF NOT EXISTS organization_join_requests_user_status_idx
  ON public.organization_join_requests (user_id, status);

ALTER TABLE public.organization_join_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2) Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.org_has_facility_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = _org_id
      AND om.role_at_org = 'facility_admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.organization_id = _org_id
      AND ur.role = 'facility_admin'::public.app_role
  );
$$;

REVOKE ALL ON FUNCTION public.org_has_facility_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.org_has_facility_admin(uuid) TO authenticated;

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
  )
  OR (
    public.has_role(_user_id, 'facility_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _user_id AND p.organization_id = _org_id
    )
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_facility_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_facility_admin(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_user_to_organization(
  _user_id uuid,
  _organization_id uuid,
  _role_at_org text DEFAULT 'bd_rep',
  _invited_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _organization_id AND user_id = _user_id
  ) THEN
    INSERT INTO public.organization_members (organization_id, user_id, role_at_org, invited_by)
    VALUES (
      _organization_id,
      _user_id,
      COALESCE(NULLIF(trim(_role_at_org), ''), 'bd_rep'),
      _invited_by
    );
  END IF;

  UPDATE public.profiles
  SET organization_id = _organization_id, updated_at = now()
  WHERE user_id = _user_id;

  IF COALESCE(NULLIF(trim(_role_at_org), ''), 'bd_rep') = 'facility_admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _user_id, 'facility_admin'::public.app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'facility_admin'::public.app_role
    );
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    SELECT _user_id, 'bd_rep'::public.app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role IN ('bd_rep'::public.app_role, 'facility_admin'::public.app_role, 'super_admin'::public.app_role)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.link_user_to_organization(uuid, uuid, text, uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3) Setup options for current user (domain org + pending request)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_org_setup_options()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  dom text;
  org_row public.organizations%ROWTYPE;
  pending_req public.organization_join_requests%ROWTYPE;
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS NULL OR position('@' in user_email) = 0 THEN
    RAISE EXCEPTION 'No email on account';
  END IF;
  dom := split_part(user_email, '@', 2);

  SELECT * INTO org_row
  FROM public.organizations
  WHERE lower(email_domain) = dom
  ORDER BY verified DESC, created_at ASC
  LIMIT 1;

  SELECT * INTO pending_req
  FROM public.organization_join_requests
  WHERE user_id = uid AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  result := jsonb_build_object(
    'email', user_email,
    'email_domain', dom,
    'matching_org', CASE WHEN org_row.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', org_row.id,
      'name', org_row.name,
      'slug', org_row.slug,
      'logo_url', org_row.logo_url,
      'verified', org_row.verified,
      'email_domain', org_row.email_domain,
      'has_admin', public.org_has_facility_admin(org_row.id)
    ) END,
    'pending_join_request', CASE WHEN pending_req.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', pending_req.id,
      'organization_id', pending_req.organization_id,
      'status', pending_req.status,
      'created_at', pending_req.created_at,
      'organization_name', (
        SELECT o.name FROM public.organizations o WHERE o.id = pending_req.organization_id
      )
    ) END,
    'can_create', org_row.id IS NULL
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_org_setup_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_setup_options() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Auto-claim pending email invite
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
  LIMIT 1;

  IF invite_row.id IS NULL THEN
    RETURN jsonb_build_object('joined', false, 'reason', 'no_invite');
  END IF;

  PERFORM public.link_user_to_organization(
    uid,
    invite_row.organization_id,
    invite_row.role_at_org,
    invite_row.invited_by
  );

  UPDATE public.org_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = invite_row.id;

  UPDATE public.organization_join_requests
  SET status = 'approved', reviewed_at = now(), updated_at = now()
  WHERE user_id = uid AND organization_id = invite_row.organization_id AND status = 'pending';

  RETURN jsonb_build_object(
    'joined', true,
    'organization_id', invite_row.organization_id,
    'role_at_org', invite_row.role_at_org
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_org_invite() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_pending_org_invite() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Request to join domain-matched organization
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_to_join_organization(_organization_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  dom text;
  org_domain text;
  existing_id uuid;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.organization_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'You already belong to an organization';
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'No email on account';
  END IF;
  dom := split_part(user_email, '@', 2);

  SELECT lower(email_domain) INTO org_domain
  FROM public.organizations
  WHERE id = _organization_id;

  IF org_domain IS NULL OR org_domain = '' THEN
    RAISE EXCEPTION 'Organization has no email domain configured';
  END IF;

  IF org_domain <> dom THEN
    RAISE EXCEPTION 'Your email domain must match @%', org_domain;
  END IF;

  SELECT id INTO existing_id
  FROM public.organization_join_requests
  WHERE organization_id = _organization_id AND user_id = uid;

  IF existing_id IS NOT NULL THEN
    UPDATE public.organization_join_requests
    SET status = 'pending',
        email = user_email,
        email_domain = dom,
        reviewed_by = NULL,
        reviewed_at = NULL,
        updated_at = now()
    WHERE id = existing_id AND status <> 'pending';
    RETURN existing_id;
  END IF;

  INSERT INTO public.organization_join_requests (
    organization_id, user_id, email, email_domain, status, role_at_org
  ) VALUES (
    _organization_id, uid, user_email, dom, 'pending', 'bd_rep'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_to_join_organization(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_to_join_organization(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) Approve / reject join request
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_organization_join_request(
  _request_id uuid,
  _approve boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  req public.organization_join_requests%ROWTYPE;
  has_admin boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO req
  FROM public.organization_join_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF req.id IS NULL THEN
    RAISE EXCEPTION 'Join request not found';
  END IF;

  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Join request is already %', req.status;
  END IF;

  has_admin := public.org_has_facility_admin(req.organization_id);

  IF NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
    IF NOT has_admin THEN
      RAISE EXCEPTION 'This organization has no admin yet. A CenterLinked superadmin must approve.';
    END IF;
    IF NOT public.is_org_facility_admin(req.organization_id, uid) THEN
      RAISE EXCEPTION 'Only organization admins can approve join requests';
    END IF;
  END IF;

  IF _approve THEN
    PERFORM public.link_user_to_organization(
      req.user_id,
      req.organization_id,
      req.role_at_org,
      uid
    );

    UPDATE public.organization_join_requests
    SET status = 'approved',
        reviewed_by = uid,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = req.id;

    UPDATE public.org_invites
    SET status = 'accepted', accepted_at = now()
    WHERE organization_id = req.organization_id
      AND lower(email) = lower(req.email)
      AND status = 'pending';
  ELSE
    UPDATE public.organization_join_requests
    SET status = 'rejected',
        reviewed_by = uid,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = req.id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.review_organization_join_request(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_organization_join_request(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) List helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_org_join_requests(_organization_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  user_id uuid,
  email text,
  email_domain text,
  status text,
  role_at_org text,
  created_at timestamptz,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_org_facility_admin(_organization_id, uid) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.organization_id,
    r.user_id,
    r.email,
    r.email_domain,
    r.status,
    r.role_at_org,
    r.created_at,
    p.full_name
  FROM public.organization_join_requests r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.organization_id = _organization_id
    AND r.status = 'pending'
  ORDER BY r.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_org_join_requests(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_org_join_requests(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_superadmin_join_requests()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  organization_name text,
  user_id uuid,
  email text,
  email_domain text,
  status text,
  role_at_org text,
  created_at timestamptz,
  full_name text,
  org_has_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.organization_id,
    o.name,
    r.user_id,
    r.email,
    r.email_domain,
    r.status,
    r.role_at_org,
    r.created_at,
    p.full_name,
    public.org_has_facility_admin(r.organization_id)
  FROM public.organization_join_requests r
  JOIN public.organizations o ON o.id = r.organization_id
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.status = 'pending'
  ORDER BY
    public.org_has_facility_admin(r.organization_id) ASC,
    r.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_superadmin_join_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_superadmin_join_requests() TO authenticated;

-- ---------------------------------------------------------------------------
-- 8) RLS policies (reads; writes go through SECURITY DEFINER RPCs)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "join_requests_select_own_or_admin" ON public.organization_join_requests;
CREATE POLICY "join_requests_select_own_or_admin"
ON public.organization_join_requests
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.is_org_facility_admin(organization_id, auth.uid())
);
