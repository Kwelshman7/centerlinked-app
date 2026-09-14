-- Professional referral network (additive).
-- Adds user-to-user connections and links BD catalog rows to login accounts.
-- Does not drop or rename existing tables. referral_network (org favorites) is unchanged.
--
-- Apply: paste into Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/professional-network-20260914.sql
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.request_professional_connection(uuid);
--   DROP FUNCTION IF EXISTS public.respond_to_professional_connection(uuid, boolean);
--   DROP FUNCTION IF EXISTS public.remove_professional_connection(uuid);
--   DROP FUNCTION IF EXISTS public.block_professional_connection(uuid);
--   DROP FUNCTION IF EXISTS public.list_my_professional_network();
--   DROP FUNCTION IF EXISTS public.list_professional_connection_requests();
--   DROP FUNCTION IF EXISTS public.search_professionals(text);
--   DROP FUNCTION IF EXISTS public.get_professional_profile(uuid);
--   DROP FUNCTION IF EXISTS public.get_public_referral_contacts(uuid, uuid);
--   DROP TABLE IF EXISTS public.professional_connections;
--   ALTER TABLE public.bd_representatives DROP COLUMN IF EXISTS user_id;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS city;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS state;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE public.bd_representatives
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bd_representatives_org_user_uidx
  ON public.bd_representatives (organization_id, user_id)
  WHERE user_id IS NOT NULL AND organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bd_representatives_user_id_idx
  ON public.bd_representatives (user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.professional_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT professional_connections_not_self CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS professional_connections_pair_uidx
  ON public.professional_connections (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );

CREATE INDEX IF NOT EXISTS professional_connections_requester_status_idx
  ON public.professional_connections (requester_id, status);

CREATE INDEX IF NOT EXISTS professional_connections_addressee_status_idx
  ON public.professional_connections (addressee_id, status);

ALTER TABLE public.professional_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants select connections" ON public.professional_connections;
CREATE POLICY "participants select connections"
  ON public.professional_connections
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

REVOKE ALL ON public.professional_connections FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.professional_connections TO authenticated;
GRANT ALL ON public.professional_connections TO service_role;

UPDATE public.bd_representatives r
SET user_id = p.user_id
FROM public.profiles p
WHERE r.user_id IS NULL
  AND r.email IS NOT NULL
  AND p.email IS NOT NULL
  AND lower(trim(r.email)) = lower(trim(p.email));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.professional_connection_status(_viewer uuid, _other uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _viewer IS NULL OR _other IS NULL THEN 'none'
    WHEN _viewer = _other THEN 'self'
    WHEN exists_row.status = 'accepted' THEN 'accepted'
    WHEN exists_row.status = 'blocked' THEN 'blocked'
    WHEN exists_row.status = 'pending' AND exists_row.requester_id = _viewer THEN 'pending_out'
    WHEN exists_row.status = 'pending' AND exists_row.addressee_id = _viewer THEN 'pending_in'
    WHEN exists_row.status = 'declined' THEN 'declined'
    ELSE 'none'
  END
  FROM (
    SELECT c.status, c.requester_id, c.addressee_id
    FROM public.professional_connections c
    WHERE (c.requester_id = _viewer AND c.addressee_id = _other)
       OR (c.requester_id = _other AND c.addressee_id = _viewer)
    LIMIT 1
  ) exists_row
  UNION ALL
  SELECT 'none'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.professional_connections c
    WHERE (c.requester_id = _viewer AND c.addressee_id = _other)
       OR (c.requester_id = _other AND c.addressee_id = _viewer)
  )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.professional_connection_status(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.professional_connection_status(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_professional_connection(_addressee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.professional_connections%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _addressee_id IS NULL OR _addressee_id = uid THEN
    RAISE EXCEPTION 'Invalid connection';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _addressee_id) THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  SELECT * INTO existing
  FROM public.professional_connections c
  WHERE (c.requester_id = uid AND c.addressee_id = _addressee_id)
     OR (c.requester_id = _addressee_id AND c.addressee_id = uid)
  LIMIT 1
  FOR UPDATE;

  IF existing.id IS NOT NULL THEN
    IF existing.status = 'accepted' THEN
      RETURN jsonb_build_object('id', existing.id, 'status', 'accepted');
    END IF;
    IF existing.status = 'blocked' THEN
      RAISE EXCEPTION 'Connection is blocked';
    END IF;
    IF existing.status = 'pending' THEN
      RETURN jsonb_build_object('id', existing.id, 'status', 'pending');
    END IF;
    UPDATE public.professional_connections
    SET requester_id = uid,
        addressee_id = _addressee_id,
        status = 'pending',
        created_at = now(),
        responded_at = NULL
    WHERE id = existing.id;
    RETURN jsonb_build_object('id', existing.id, 'status', 'pending');
  END IF;

  INSERT INTO public.professional_connections (requester_id, addressee_id, status)
  VALUES (uid, _addressee_id, 'pending')
  RETURNING * INTO existing;

  RETURN jsonb_build_object('id', existing.id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_professional_connection(_connection_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.professional_connections%ROWTYPE;
  next_status text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing
  FROM public.professional_connections
  WHERE id = _connection_id
  FOR UPDATE;

  IF existing.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF existing.addressee_id <> uid THEN
    RAISE EXCEPTION 'Only the recipient can respond';
  END IF;
  IF existing.status <> 'pending' THEN
    RETURN jsonb_build_object('id', existing.id, 'status', existing.status);
  END IF;

  next_status := CASE WHEN _accept THEN 'accepted' ELSE 'declined' END;
  UPDATE public.professional_connections
  SET status = next_status, responded_at = now()
  WHERE id = existing.id;

  RETURN jsonb_build_object('id', existing.id, 'status', next_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_professional_connection(_other_user_id uuid)
RETURNS jsonb
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

  DELETE FROM public.professional_connections
  WHERE status <> 'blocked'
    AND (
      (requester_id = uid AND addressee_id = _other_user_id)
      OR (requester_id = _other_user_id AND addressee_id = uid)
    );

  RETURN jsonb_build_object('removed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.block_professional_connection(_other_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.professional_connections%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _other_user_id IS NULL OR _other_user_id = uid THEN
    RAISE EXCEPTION 'Invalid connection';
  END IF;

  SELECT * INTO existing
  FROM public.professional_connections c
  WHERE (c.requester_id = uid AND c.addressee_id = _other_user_id)
     OR (c.requester_id = _other_user_id AND c.addressee_id = uid)
  LIMIT 1
  FOR UPDATE;

  IF existing.id IS NULL THEN
    INSERT INTO public.professional_connections (requester_id, addressee_id, status, responded_at)
    VALUES (uid, _other_user_id, 'blocked', now());
  ELSE
    UPDATE public.professional_connections
    SET status = 'blocked', responded_at = now()
    WHERE id = existing.id;
  END IF;

  RETURN jsonb_build_object('status', 'blocked');
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_professional_network()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(card ORDER BY card->>'full_name')
    FROM (
      SELECT jsonb_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name,
        'job_title', p.job_title,
        'avatar_url', p.avatar_url,
        'phone', p.phone,
        'email', p.email,
        'city', p.city,
        'state', p.state,
        'organization', CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'logo_url', o.logo_url,
          'hq_city', o.hq_city,
          'hq_state', o.hq_state
        ) END,
        'connected_at', c.responded_at,
        'connection_id', c.id
      ) AS card
      FROM public.professional_connections c
      JOIN public.profiles p
        ON p.user_id = CASE
          WHEN c.requester_id = uid THEN c.addressee_id
          ELSE c.requester_id
        END
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      WHERE c.status = 'accepted'
        AND (c.requester_id = uid OR c.addressee_id = uid)
    ) rows
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_professional_connection_requests()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(card ORDER BY card->>'created_at' DESC)
    FROM (
      SELECT jsonb_build_object(
        'connection_id', c.id,
        'user_id', p.user_id,
        'full_name', p.full_name,
        'job_title', p.job_title,
        'avatar_url', p.avatar_url,
        'city', p.city,
        'state', p.state,
        'created_at', c.created_at,
        'organization', CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'logo_url', o.logo_url
        ) END
      ) AS card
      FROM public.professional_connections c
      JOIN public.profiles p ON p.user_id = c.requester_id
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      WHERE c.addressee_id = uid AND c.status = 'pending'
    ) rows
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.search_professionals(_query text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  q text := trim(coalesce(_query, ''));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(card)
    FROM (
      SELECT jsonb_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name,
        'job_title', p.job_title,
        'avatar_url', p.avatar_url,
        'city', p.city,
        'state', p.state,
        'organization', CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'logo_url', o.logo_url,
          'hq_city', o.hq_city,
          'hq_state', o.hq_state
        ) END,
        'connection_status', public.professional_connection_status(uid, p.user_id)
      ) AS card
      FROM public.profiles p
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.user_id <> uid
        AND (
          q = ''
          OR p.full_name ILIKE '%' || q || '%'
          OR o.name ILIKE '%' || q || '%'
          OR coalesce(p.job_title, '') ILIKE '%' || q || '%'
          OR coalesce(p.city, '') ILIKE '%' || q || '%'
          OR coalesce(p.state, '') ILIKE '%' || q || '%'
        )
      ORDER BY
        CASE
          WHEN q = '' THEN 2
          WHEN lower(coalesce(p.full_name, '')) LIKE lower(q) || '%' THEN 0
          WHEN lower(coalesce(p.full_name, '')) LIKE '% ' || lower(q) || '%' THEN 0
          WHEN lower(coalesce(p.full_name, '')) LIKE '%' || lower(q) || '%' THEN 1
          ELSE 2
        END,
        p.full_name NULLS LAST
      LIMIT 80
    ) rows
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_professional_profile(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.profiles%ROWTYPE;
  org_json jsonb;
  fac_json jsonb;
  conn_id uuid;
  conn_status text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  SELECT * INTO p FROM public.profiles WHERE user_id = _user_id;
  IF p.id IS NULL THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'logo_url', o.logo_url,
    'hq_city', o.hq_city,
    'hq_state', o.hq_state,
    'verified', o.verified
  )
  INTO org_json
  FROM public.organizations o
  WHERE o.id = p.organization_id;

  SELECT c.id INTO conn_id
  FROM public.professional_connections c
  WHERE (c.requester_id = uid AND c.addressee_id = _user_id)
     OR (c.requester_id = _user_id AND c.addressee_id = uid)
  LIMIT 1;

  conn_status := public.professional_connection_status(uid, _user_id);

  SELECT coalesce(jsonb_agg(fac ORDER BY fac->>'name'), '[]'::jsonb)
  INTO fac_json
  FROM (
    SELECT DISTINCT ON (f.id)
      jsonb_build_object(
        'id', f.id,
        'name', f.name,
        'slug', f.slug,
        'city', f.city,
        'state', f.state,
        'levels_of_care', coalesce(f.levels_of_care, '{}'::text[]),
        'payers', coalesce((
          SELECT jsonb_agg(DISTINCT ic.payer_name ORDER BY ic.payer_name)
          FROM public.insurance_contracts ic
          WHERE ic.facility_id = f.id
            AND ic.in_network = true
            AND ic.payer_name IS NOT NULL
            AND ic.payer_name <> ''
        ), '[]'::jsonb)
      ) AS fac
    FROM public.facilities f
    LEFT JOIN public.facility_bd_assignments a ON a.facility_id = f.id
    LEFT JOIN public.bd_representatives r ON r.id = a.representative_id
    WHERE f.verification_status = 'approved'
      AND coalesce(f.verification_frozen, false) = false
      AND (
        r.user_id = _user_id
        OR (p.email IS NOT NULL AND lower(trim(coalesce(r.email, ''))) = lower(trim(p.email)))
        OR (p.email IS NOT NULL AND lower(trim(coalesce(f.bd_contact_email, ''))) = lower(trim(p.email)))
        OR (p.organization_id IS NOT NULL AND f.organization_id = p.organization_id)
      )
    ORDER BY f.id
  ) rows;

  RETURN jsonb_build_object(
    'user_id', p.user_id,
    'full_name', p.full_name,
    'job_title', p.job_title,
    'avatar_url', p.avatar_url,
    'phone', p.phone,
    'email', p.email,
    'bio', p.bio,
    'city', p.city,
    'state', p.state,
    'organization', org_json,
    'connection_status', conn_status,
    'connection_id', conn_id,
    'facilities', coalesce(fac_json, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_referral_contacts(_organization_id uuid, _facility_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fac public.facilities%ROWTYPE;
  org public.organizations%ROWTYPE;
  name text;
  title text;
  phone text;
  contact_email text;
  avatar text;
  linked uuid;
BEGIN
  IF _organization_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT * INTO org FROM public.organizations WHERE id = _organization_id;
  IF org.id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF _facility_id IS NOT NULL THEN
    SELECT * INTO fac
    FROM public.facilities
    WHERE id = _facility_id
      AND organization_id = _organization_id
      AND verification_status = 'approved';
    IF fac.id IS NULL THEN
      RETURN '[]'::jsonb;
    END IF;
  END IF;

  IF fac.id IS NOT NULL
     AND nullif(trim(fac.bd_contact_name), '') IS NOT NULL
     AND (
       nullif(trim(fac.bd_contact_phone), '') IS NOT NULL
       OR nullif(trim(fac.bd_contact_email), '') IS NOT NULL
     )
  THEN
    name := trim(fac.bd_contact_name);
    title := coalesce(nullif(trim(fac.bd_contact_title), ''), 'Business Development Representative');
    phone := fac.bd_contact_phone;
    contact_email := fac.bd_contact_email;
  ELSIF nullif(trim(org.bd_contact_name), '') IS NOT NULL
     AND (
       nullif(trim(org.bd_contact_phone), '') IS NOT NULL
       OR nullif(trim(org.bd_contact_email), '') IS NOT NULL
     )
  THEN
    name := trim(org.bd_contact_name);
    title := 'Director of Business Development';
    phone := org.bd_contact_phone;
    contact_email := org.bd_contact_email;
  ELSE
    RETURN '[]'::jsonb;
  END IF;

  IF contact_email IS NOT NULL AND trim(contact_email) <> '' THEN
    SELECT r.avatar_url, r.user_id
    INTO avatar, linked
    FROM public.bd_representatives r
    WHERE r.active = true
      AND r.email IS NOT NULL
      AND lower(trim(r.email)) = lower(trim(contact_email))
      AND (r.organization_id IS NULL OR r.organization_id = _organization_id)
    ORDER BY r.user_id NULLS LAST
    LIMIT 1;

    IF avatar IS NULL THEN
      SELECT p.avatar_url, p.user_id
      INTO avatar, linked
      FROM public.profiles p
      WHERE p.email IS NOT NULL
        AND lower(trim(p.email)) = lower(trim(contact_email))
      LIMIT 1;
    END IF;
  END IF;

  IF avatar IS NULL AND fac.id IS NOT NULL THEN
    SELECT r.avatar_url, r.user_id
    INTO avatar, linked
    FROM public.facility_bd_assignments a
    JOIN public.bd_representatives r ON r.id = a.representative_id
    WHERE a.facility_id = fac.id
      AND r.active = true
    ORDER BY a.is_primary DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_array(jsonb_build_object(
    'name', name,
    'title', title,
    'phone', phone,
    'email', contact_email,
    'avatar_url', avatar,
    'user_id', linked
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.request_professional_connection(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_professional_connection(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_professional_connection(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_professional_connection(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_my_professional_network() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_professional_connection_requests() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.search_professionals(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_professional_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_public_referral_contacts(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.request_professional_connection(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_professional_connection(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_professional_connection(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.block_professional_connection(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_my_professional_network() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_professional_connection_requests() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_professionals(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_professional_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_referral_contacts(uuid, uuid) TO anon, authenticated, service_role;
