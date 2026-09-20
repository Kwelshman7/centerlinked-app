-- BD profile page extensions (additive).
-- Adds years_in_bh on profiles, saved_professionals, shared-connection RPC,
-- and years_in_bh on get_professional_profile JSON.
--
-- Apply: paste into Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/bd-profile-extensions-20260920.sql
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.list_shared_professional_connections(uuid);
--   DROP TABLE IF EXISTS public.saved_professionals;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS years_in_bh;
--   -- then restore get_professional_profile from professional-network-20260914.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS years_in_bh integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_years_in_bh_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_years_in_bh_range
      CHECK (years_in_bh IS NULL OR (years_in_bh >= 0 AND years_in_bh <= 80));
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.saved_professionals (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_user_id),
  CONSTRAINT saved_professionals_not_self CHECK (user_id <> target_user_id)
);

CREATE INDEX IF NOT EXISTS saved_professionals_target_idx
  ON public.saved_professionals (target_user_id);

ALTER TABLE public.saved_professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users select own saved professionals" ON public.saved_professionals;
CREATE POLICY "users select own saved professionals"
  ON public.saved_professionals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users insert own saved professionals" ON public.saved_professionals;
CREATE POLICY "users insert own saved professionals"
  ON public.saved_professionals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own saved professionals" ON public.saved_professionals;
CREATE POLICY "users delete own saved professionals"
  ON public.saved_professionals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.saved_professionals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_professionals TO authenticated;
GRANT ALL ON public.saved_professionals TO service_role;

CREATE OR REPLACE FUNCTION public.list_shared_professional_connections(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  total integer := 0;
  people jsonb := '[]'::jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _user_id IS NULL OR _user_id = uid THEN
    RETURN jsonb_build_object('count', 0, 'people', '[]'::jsonb);
  END IF;

  WITH viewer AS (
    SELECT CASE
      WHEN c.requester_id = uid THEN c.addressee_id
      ELSE c.requester_id
    END AS other_id
    FROM public.professional_connections c
    WHERE c.status = 'accepted'
      AND (c.requester_id = uid OR c.addressee_id = uid)
  ),
  subject AS (
    SELECT CASE
      WHEN c.requester_id = _user_id THEN c.addressee_id
      ELSE c.requester_id
    END AS other_id
    FROM public.professional_connections c
    WHERE c.status = 'accepted'
      AND (c.requester_id = _user_id OR c.addressee_id = _user_id)
  ),
  mutual AS (
    SELECT v.other_id
    FROM viewer v
    JOIN subject s ON s.other_id = v.other_id
    WHERE v.other_id <> uid
      AND v.other_id <> _user_id
  ),
  counted AS (
    SELECT count(*)::integer AS n FROM mutual
  ),
  cards AS (
    SELECT coalesce(jsonb_agg(card), '[]'::jsonb) AS people
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
        ) END
      ) AS card
      FROM mutual m
      JOIN public.profiles p ON p.user_id = m.other_id
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      ORDER BY p.full_name NULLS LAST
      LIMIT 8
    ) rows
  )
  SELECT counted.n, cards.people
  INTO total, people
  FROM counted
  CROSS JOIN cards;

  RETURN jsonb_build_object('count', coalesce(total, 0), 'people', coalesce(people, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.list_shared_professional_connections(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_shared_professional_connections(uuid) TO authenticated, service_role;

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
    'years_in_bh', p.years_in_bh,
    'organization', org_json,
    'connection_status', conn_status,
    'connection_id', conn_id,
    'facilities', coalesce(fac_json, '[]'::jsonb)
  );
END;
$$;
