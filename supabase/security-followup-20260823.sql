-- Security follow-up (23 Aug 2026). Apply after the production bundle
-- (migrations/20260802120000_production_security_bundle.sql steps 1–10).
-- Paste into the Supabase SQL Editor. Idempotent.
--
-- 1) Hide organization billing columns from PostgREST clients
-- 2) RPC get_organization_billing for org members / super_admin
-- 3) Block client-set billing fields on INSERT (not only UPDATE)
-- 4) Lock preferred_provider / preferred_until to super_admin
-- 5) Gate list_facilities_due_for_verification to super_admin / service_role
-- 6) Tenant-scope posts / post_likes SELECT
-- 7) get_public_program_sheet requires organizations.verified

-- ---------------------------------------------------------------------------
-- 1) Column privileges: billing fields are not client-readable
-- ---------------------------------------------------------------------------
-- Column-level REVOKE is a no-op while table-level SELECT remains.
REVOKE SELECT ON public.organizations FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  name,
  email_domain,
  logo_url,
  website,
  description,
  hq_city,
  hq_state,
  verified,
  created_by,
  created_at,
  updated_at,
  phone,
  num_facilities,
  bd_contact_name,
  bd_contact_phone,
  bd_contact_email,
  slug,
  tagline,
  brand_color,
  accent_color,
  cover_image_url,
  announcement,
  program_badges,
  cta_primary_label,
  cta_secondary_label,
  why_refer,
  image_urls,
  footer_image_url,
  social_facebook_url,
  social_instagram_url,
  social_linkedin_url,
  social_x_url,
  favicon_url
) ON public.organizations TO anon, authenticated;

GRANT SELECT ON public.organizations TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Org members and super_admin read their own billing snapshot
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_organization_billing(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  payload jsonb;
BEGIN
  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT (
    public.has_role(uid, 'super_admin'::public.app_role)
    OR public.is_org_member(uid, _org_id)
  ) THEN
    RAISE EXCEPTION 'Not allowed to view billing for this organization'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'subscription_status', COALESCE(o.subscription_status, 'none'),
    'subscription_current_period_end', o.subscription_current_period_end,
    'setup_package', o.setup_package,
    'stripe_customer_id', o.stripe_customer_id,
    'stripe_subscription_id', o.stripe_subscription_id,
    'subscription_price_id', o.subscription_price_id,
    'billing_email', o.billing_email
  )
  INTO payload
  FROM public.organizations o
  WHERE o.id = _org_id;

  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_organization_billing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_billing(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Billing column write lock: INSERT or UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  billing_changed boolean;
BEGIN
  IF coalesce(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    billing_changed :=
      NEW.stripe_customer_id IS NOT NULL
      OR NEW.stripe_subscription_id IS NOT NULL
      OR COALESCE(NEW.subscription_status, 'none') IS DISTINCT FROM 'none'
      OR NEW.subscription_price_id IS NOT NULL
      OR NEW.subscription_current_period_end IS NOT NULL
      OR NEW.setup_package IS NOT NULL
      OR NEW.billing_email IS NOT NULL;
  ELSE
    billing_changed :=
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
      OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
      OR NEW.subscription_price_id IS DISTINCT FROM OLD.subscription_price_id
      OR NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end
      OR NEW.setup_package IS DISTINCT FROM OLD.setup_package
      OR NEW.billing_email IS DISTINCT FROM OLD.billing_email;
  END IF;

  IF billing_changed THEN
    RAISE EXCEPTION 'Organization billing fields are read-only';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_billing_columns ON public.organizations;
CREATE TRIGGER protect_organization_billing_columns
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_billing_columns();

-- ---------------------------------------------------------------------------
-- 4) preferred_provider / preferred_until: super_admin or privileged writer
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_facility_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  approval_changed boolean;
  freeze_changed boolean;
  preferred_changed boolean;
BEGIN
  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    approval_changed :=
      COALESCE(NEW.verification_status, 'pending'::public.verification_status)
        IS DISTINCT FROM 'pending'::public.verification_status
      OR NEW.verified_at IS NOT NULL
      OR NEW.verified_by IS NOT NULL
      OR NEW.rejection_reason IS NOT NULL;
    freeze_changed := COALESCE(NEW.verification_frozen, false) IS DISTINCT FROM false;
    preferred_changed :=
      COALESCE(NEW.preferred_provider, false) IS DISTINCT FROM false
      OR NEW.preferred_until IS NOT NULL;
  ELSE
    approval_changed :=
      NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason;
    freeze_changed := NEW.verification_frozen IS DISTINCT FROM OLD.verification_frozen;
    preferred_changed :=
      NEW.preferred_provider IS DISTINCT FROM OLD.preferred_provider
      OR NEW.preferred_until IS DISTINCT FROM OLD.preferred_until;
  END IF;

  IF freeze_changed THEN
    RAISE EXCEPTION 'facilities.verification_frozen is read-only'
      USING ERRCODE = '42501';
  END IF;

  IF approval_changed OR preferred_changed THEN
    IF public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
      RETURN NEW;
    END IF;
    IF preferred_changed AND NOT approval_changed THEN
      RAISE EXCEPTION 'Facility preferred-provider fields are read-only'
        USING ERRCODE = '42501';
    END IF;
    RAISE EXCEPTION 'Facility approval fields are read-only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5) Due-for-verification list: super_admin or service_role only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_facilities_due_for_verification(_days integer DEFAULT 60)
RETURNS TABLE (
  contracts_verified_at timestamptz,
  facility_id uuid,
  facility_name text,
  organization_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  days integer := COALESCE(_days, 60);
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(uid, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not allowed to list facilities due for verification'
      USING ERRCODE = '42501';
  END IF;

  IF days < 1 OR days > 3650 THEN
    RAISE EXCEPTION 'days must be between 1 and 3650';
  END IF;

  RETURN QUERY
  SELECT
    f.contracts_verified_at,
    f.id,
    f.name,
    f.organization_id
  FROM public.facilities f
  WHERE f.verification_status = 'approved'::public.verification_status
    AND (
      f.contracts_verified_at IS NULL
      OR f.contracts_verified_at < (timezone('utc', now()) - make_interval(days => days))
    )
  ORDER BY f.contracts_verified_at ASC NULLS FIRST;
END;
$$;

REVOKE ALL ON FUNCTION public.list_facilities_due_for_verification(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_facilities_due_for_verification(integer) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Community tables: own-org SELECT (UI gate is not security)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth users view posts" ON public.posts;
DROP POLICY IF EXISTS "org members view own org posts" ON public.posts;
CREATE POLICY "org members view own org posts"
ON public.posts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.is_org_member(auth.uid(), organization_id)
);

DROP POLICY IF EXISTS "auth users view likes" ON public.post_likes;
DROP POLICY IF EXISTS "org members view own org likes" ON public.post_likes;
CREATE POLICY "org members view own org likes"
ON public.post_likes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_likes.post_id
      AND public.is_org_member(auth.uid(), p.organization_id)
  )
);

-- ---------------------------------------------------------------------------
-- 7) Public program sheet: verified org, same as get_public_org_sheet
-- ---------------------------------------------------------------------------
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
  JOIN public.organizations o ON o.id = f.organization_id
  WHERE f.slug = slug_val
    AND f.verification_status = 'approved'
    AND COALESCE(f.verification_frozen, false) = false
    AND o.verified = true
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

REVOKE ALL ON FUNCTION public.get_public_program_sheet(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_program_sheet(text, text) TO anon, authenticated;
