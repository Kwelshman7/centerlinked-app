-- Tighten overly broad SELECT policies discovered in the live RLS dump.
-- Run: npx supabase db query --linked -f supabase/rls-tenant-hardening.sql

-- ---------------------------------------------------------------------------
-- organizations: public/anon may only see verified orgs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "anon can view verified organizations" ON public.organizations;
CREATE POLICY "anon can view verified organizations"
ON public.organizations
FOR SELECT
TO anon
USING (verified = true);

DROP POLICY IF EXISTS "authenticated users view all orgs" ON public.organizations;
DROP POLICY IF EXISTS "authenticated view verified or member orgs" ON public.organizations;
CREATE POLICY "authenticated view verified or member orgs"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  verified = true
  OR public.is_org_member(auth.uid(), id)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.facilities f
    WHERE f.organization_id = organizations.id
      AND f.verification_status = 'approved'
      AND COALESCE(f.verification_frozen, false) = false
  )
);

-- ---------------------------------------------------------------------------
-- facilities / insurance_contracts: anon cannot list the catalog.
-- Public share pages load one org/program via SECURITY DEFINER RPCs below.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon can view approved facilities" ON public.facilities;
DROP POLICY IF EXISTS "anon can view contracts of approved facilities" ON public.insurance_contracts;

-- ---------------------------------------------------------------------------
-- profiles: stop authenticated users from reading every profile
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth users view profiles" ON public.profiles;
DROP POLICY IF EXISTS "users view own org or admin profiles" ON public.profiles;
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

-- ---------------------------------------------------------------------------
-- Public share RPCs: one verified org / approved program at a time.
-- Do not SELECT to_jsonb(organizations.*) — that would leak billing columns.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_org_sheet(text);
CREATE OR REPLACE FUNCTION public.get_public_org_sheet(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug_val text := nullif(trim(coalesce(_slug, '')), '');
  org_id uuid;
  payload jsonb;
BEGIN
  IF slug_val IS NULL OR char_length(slug_val) > 120 THEN
    RETURN NULL;
  END IF;

  SELECT o.id INTO org_id
  FROM public.organizations o
  WHERE o.slug = slug_val
    AND o.verified = true
  LIMIT 1;

  IF org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'org', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'logo_url', o.logo_url,
        'favicon_url', o.favicon_url,
        'footer_image_url', o.footer_image_url,
        'social_facebook_url', o.social_facebook_url,
        'social_instagram_url', o.social_instagram_url,
        'social_linkedin_url', o.social_linkedin_url,
        'social_x_url', o.social_x_url,
        'description', o.description,
        'tagline', o.tagline,
        'website', o.website,
        'hq_city', o.hq_city,
        'hq_state', o.hq_state,
        'bd_contact_name', o.bd_contact_name,
        'bd_contact_phone', o.bd_contact_phone,
        'bd_contact_email', o.bd_contact_email,
        'brand_color', o.brand_color,
        'accent_color', o.accent_color,
        'cover_image_url', o.cover_image_url,
        'image_urls', o.image_urls,
        'verified', o.verified,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'program_badges', o.program_badges,
        'announcement', o.announcement,
        'why_refer', o.why_refer
      )
      FROM public.organizations o
      WHERE o.id = org_id
    ),
    'facilities', COALESCE((
      SELECT jsonb_agg(fac ORDER BY fac->>'name')
      FROM (
        SELECT jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'slug', f.slug,
          'city', f.city,
          'state', f.state,
          'address_line1', f.address_line1,
          'zip', f.zip,
          'image_urls', f.image_urls,
          'levels_of_care', f.levels_of_care,
          'population_served', f.population_served,
          'specializations', f.specializations,
          'highlights', f.highlights,
          'accreditations', f.accreditations,
          'short_description', f.short_description,
          'description', f.description,
          'tagline', f.tagline,
          'insurance_status', f.insurance_status,
          'featured_payer', f.featured_payer,
          'updated_at', f.updated_at,
          'contracts_verified_at', f.contracts_verified_at,
          'hidden_from_org_page', f.hidden_from_org_page,
          'verification_frozen', f.verification_frozen,
          'verification_status', f.verification_status
        ) AS fac
        FROM public.facilities f
        WHERE f.organization_id = org_id
          AND f.verification_status = 'approved'
          AND COALESCE(f.verification_frozen, false) = false
          AND COALESCE(f.hidden_from_org_page, false) = false
      ) listed
    ), '[]'::jsonb),
    'contracts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'facility_id', c.facility_id,
        'payer_name', c.payer_name,
        'in_network', c.in_network
      ) ORDER BY c.payer_name)
      FROM public.insurance_contracts c
      JOIN public.facilities f ON f.id = c.facility_id
      WHERE f.organization_id = org_id
        AND f.verification_status = 'approved'
        AND COALESCE(f.verification_frozen, false) = false
        AND COALESCE(f.hidden_from_org_page, false) = false
        AND c.in_network = true
    ), '[]'::jsonb)
  ) INTO payload;

  RETURN payload;
END;
$$;

DROP FUNCTION IF EXISTS public.get_public_program_sheet(text, text);
CREATE OR REPLACE FUNCTION public.get_public_program_sheet(_slug text, _org_slug text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug_val text := nullif(trim(coalesce(_slug, '')), '');
  org_slug_val text := nullif(trim(coalesce(_org_slug, '')), '');
  fac_id uuid;
  org_id uuid;
  payload jsonb;
BEGIN
  IF slug_val IS NULL OR char_length(slug_val) > 120 THEN
    RETURN NULL;
  END IF;
  IF org_slug_val IS NOT NULL AND char_length(org_slug_val) > 120 THEN
    RETURN NULL;
  END IF;

  SELECT f.id, f.organization_id INTO fac_id, org_id
  FROM public.facilities f
  WHERE f.slug = slug_val
    AND f.verification_status = 'approved'
    AND COALESCE(f.verification_frozen, false) = false
  LIMIT 1;

  IF fac_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF org_slug_val IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND o.slug = org_slug_val
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'facility', (
      SELECT jsonb_build_object(
        'id', f.id,
        'organization_id', f.organization_id,
        'name', f.name,
        'slug', f.slug,
        'description', f.description,
        'tagline', f.tagline,
        'short_description', f.short_description,
        'address_line1', f.address_line1,
        'city', f.city,
        'state', f.state,
        'zip', f.zip,
        'phone', f.phone,
        'website', f.website,
        'capacity', f.capacity,
        'highlights', f.highlights,
        'quick_highlights', f.quick_highlights,
        'accreditations', f.accreditations,
        'image_urls', f.image_urls,
        'levels_of_care', f.levels_of_care,
        'population_served', f.population_served,
        'specializations', f.specializations,
        'treatment_focus', f.treatment_focus,
        'insurance_status', f.insurance_status,
        'bd_contact_name', f.bd_contact_name,
        'bd_contact_phone', f.bd_contact_phone,
        'bd_contact_email', f.bd_contact_email,
        'verification_status', f.verification_status,
        'verification_frozen', f.verification_frozen,
        'hidden_from_org_page', f.hidden_from_org_page,
        'created_at', f.created_at,
        'updated_at', f.updated_at,
        'contracts_verified_at', f.contracts_verified_at
      )
      FROM public.facilities f
      WHERE f.id = fac_id
    ),
    'org', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'logo_url', o.logo_url,
        'favicon_url', o.favicon_url,
        'footer_image_url', o.footer_image_url,
        'social_facebook_url', o.social_facebook_url,
        'social_instagram_url', o.social_instagram_url,
        'social_linkedin_url', o.social_linkedin_url,
        'social_x_url', o.social_x_url,
        'bd_contact_name', o.bd_contact_name,
        'bd_contact_phone', o.bd_contact_phone,
        'bd_contact_email', o.bd_contact_email,
        'website', o.website,
        'tagline', o.tagline,
        'brand_color', o.brand_color,
        'accent_color', o.accent_color,
        'cover_image_url', o.cover_image_url,
        'verified', o.verified,
        'updated_at', o.updated_at
      )
      FROM public.organizations o
      WHERE o.id = org_id
    ),
    'contracts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'payer_id', c.payer_id,
        'payer_name', c.payer_name,
        'in_network', c.in_network
      ) ORDER BY c.payer_name)
      FROM public.insurance_contracts c
      WHERE c.facility_id = fac_id
        AND c.in_network = true
    ), '[]'::jsonb)
  ) INTO payload;

  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_org_sheet(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_org_sheet(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_program_sheet(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_program_sheet(text, text) TO anon, authenticated;
