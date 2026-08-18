-- Atomic facility + insurance contract writes with server-side validation.
-- Run: npx supabase db query --linked -f supabase/save-facility-with-contracts.sql

CREATE OR REPLACE FUNCTION public.save_facility_with_contracts(
  _organization_id uuid,
  _facility jsonb,
  _contracts jsonb DEFAULT '[]'::jsonb,
  _facility_id uuid DEFAULT NULL,
  _contracts_mode text DEFAULT 'all'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  mode text := lower(coalesce(nullif(trim(_contracts_mode), ''), 'all'));
  fac_id uuid;
  org_id uuid;
  fac_name text;
  fac_tagline text;
  fac_address text;
  fac_city text;
  fac_state text;
  fac_zip text;
  fac_phone text;
  fac_website text;
  fac_description text;
  fac_capacity integer;
  fac_levels text[];
  fac_highlights text[];
  fac_population text[];
  fac_specializations text[];
  fac_accreditations text[];
  fac_images text[];
  fac_bd_name text;
  fac_bd_phone text;
  fac_bd_email text;
  fac_hidden boolean;
  fac_verification public.verification_status;
  has_hidden_key boolean;
  contract_count integer;
  rec jsonb;
  payer_id_val uuid;
  payer_name_val text;
  in_network_val boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  IF mode NOT IN ('all', 'in_network', 'none') THEN
    RAISE EXCEPTION 'Invalid contracts mode';
  END IF;

  IF _facility IS NULL OR jsonb_typeof(_facility) <> 'object' THEN
    RAISE EXCEPTION 'facility payload is required';
  END IF;

  -- Live signature: is_org_member(_user_id, _org_id); is_org_facility_admin(_org_id, _user_id)
  IF NOT (
    public.has_role(uid, 'super_admin'::public.app_role)
    OR public.is_org_facility_admin(_organization_id, uid)
    OR public.is_org_member(uid, _organization_id)
  ) THEN
    RAISE EXCEPTION 'Not allowed to manage facilities for this organization'
      USING ERRCODE = '42501';
  END IF;

  fac_name := nullif(trim(coalesce(_facility->>'name', '')), '');
  IF fac_name IS NULL OR char_length(fac_name) > 200 THEN
    RAISE EXCEPTION 'Facility name is required (max 200 characters)';
  END IF;

  fac_tagline := nullif(trim(coalesce(_facility->>'tagline', '')), '');
  fac_address := nullif(trim(coalesce(_facility->>'address_line1', '')), '');
  fac_city := nullif(trim(coalesce(_facility->>'city', '')), '');
  fac_state := nullif(trim(coalesce(_facility->>'state', '')), '');
  fac_zip := nullif(trim(coalesce(_facility->>'zip', '')), '');
  fac_phone := nullif(trim(coalesce(_facility->>'phone', '')), '');
  fac_website := nullif(trim(coalesce(_facility->>'website', '')), '');
  fac_description := nullif(trim(coalesce(_facility->>'description', '')), '');
  fac_bd_name := nullif(trim(coalesce(_facility->>'bd_contact_name', '')), '');
  fac_bd_phone := nullif(trim(coalesce(_facility->>'bd_contact_phone', '')), '');
  fac_bd_email := nullif(trim(coalesce(_facility->>'bd_contact_email', '')), '');

  IF fac_tagline IS NOT NULL AND char_length(fac_tagline) > 240 THEN
    RAISE EXCEPTION 'Tagline is too long';
  END IF;
  IF fac_address IS NOT NULL AND char_length(fac_address) > 240 THEN
    RAISE EXCEPTION 'Address is too long';
  END IF;
  IF fac_city IS NOT NULL AND char_length(fac_city) > 120 THEN
    RAISE EXCEPTION 'City is too long';
  END IF;
  IF fac_state IS NOT NULL AND char_length(fac_state) > 40 THEN
    RAISE EXCEPTION 'State is too long';
  END IF;
  IF fac_zip IS NOT NULL AND char_length(fac_zip) > 20 THEN
    RAISE EXCEPTION 'ZIP is too long';
  END IF;
  IF fac_phone IS NOT NULL AND char_length(fac_phone) > 40 THEN
    RAISE EXCEPTION 'Phone is too long';
  END IF;
  IF fac_website IS NOT NULL AND (
    char_length(fac_website) > 500
    OR fac_website ~* '^\s*(javascript|data):'
  ) THEN
    RAISE EXCEPTION 'Website URL is invalid';
  END IF;
  IF fac_description IS NOT NULL AND char_length(fac_description) > 20000 THEN
    RAISE EXCEPTION 'Description is too long';
  END IF;
  IF fac_bd_email IS NOT NULL AND (
    char_length(fac_bd_email) > 254
    OR fac_bd_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) THEN
    RAISE EXCEPTION 'BD contact email is invalid';
  END IF;

  IF (_facility ? 'capacity') AND nullif(trim(coalesce(_facility->>'capacity', '')), '') IS NOT NULL THEN
    BEGIN
      fac_capacity := (_facility->>'capacity')::integer;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Capacity must be an integer';
    END;
    IF fac_capacity < 0 OR fac_capacity > 100000 THEN
      RAISE EXCEPTION 'Capacity is out of range';
    END IF;
  ELSE
    fac_capacity := NULL;
  END IF;

  fac_levels := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'levels_of_care', '[]'::jsonb))),
    ARRAY[]::text[]
  );
  fac_highlights := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'highlights', '[]'::jsonb))),
    ARRAY[]::text[]
  );
  fac_population := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'population_served', '[]'::jsonb))),
    ARRAY[]::text[]
  );
  fac_specializations := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'specializations', '[]'::jsonb))),
    ARRAY[]::text[]
  );
  fac_accreditations := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'accreditations', '[]'::jsonb))),
    ARRAY[]::text[]
  );
  fac_images := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_facility->'image_urls', '[]'::jsonb))),
    ARRAY[]::text[]
  );

  IF coalesce(array_length(fac_levels, 1), 0) > 40
     OR coalesce(array_length(fac_highlights, 1), 0) > 80
     OR coalesce(array_length(fac_population, 1), 0) > 40
     OR coalesce(array_length(fac_specializations, 1), 0) > 80
     OR coalesce(array_length(fac_accreditations, 1), 0) > 40
     OR coalesce(array_length(fac_images, 1), 0) > 40 THEN
    RAISE EXCEPTION 'Too many list values on facility payload';
  END IF;

  has_hidden_key := _facility ? 'hidden_from_org_page';
  fac_hidden := COALESCE((_facility->>'hidden_from_org_page')::boolean, false);

  IF jsonb_typeof(COALESCE(_contracts, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'contracts must be an array';
  END IF;
  contract_count := jsonb_array_length(COALESCE(_contracts, '[]'::jsonb));
  IF contract_count > 200 THEN
    RAISE EXCEPTION 'Too many insurance contracts';
  END IF;

  IF _facility_id IS NULL THEN
    fac_verification := CASE
      WHEN public.has_role(uid, 'super_admin'::public.app_role)
        THEN 'approved'::public.verification_status
      ELSE 'pending'::public.verification_status
    END;

    INSERT INTO public.facilities (
      organization_id,
      submitted_by,
      name,
      tagline,
      address_line1,
      city,
      state,
      zip,
      phone,
      website,
      description,
      capacity,
      levels_of_care,
      highlights,
      population_served,
      specializations,
      accreditations,
      image_urls,
      bd_contact_name,
      bd_contact_phone,
      bd_contact_email,
      hidden_from_org_page,
      verification_status
    ) VALUES (
      _organization_id,
      uid,
      fac_name,
      fac_tagline,
      fac_address,
      fac_city,
      fac_state,
      fac_zip,
      fac_phone,
      fac_website,
      fac_description,
      fac_capacity,
      fac_levels,
      fac_highlights,
      fac_population,
      fac_specializations,
      fac_accreditations,
      fac_images,
      fac_bd_name,
      fac_bd_phone,
      fac_bd_email,
      CASE WHEN has_hidden_key THEN fac_hidden ELSE false END,
      fac_verification
    )
    RETURNING id INTO fac_id;

    UPDATE public.facilities
    SET slug = trim(both '-' from
      public.slugify(fac_name)
      || CASE
           WHEN fac_city IS NOT NULL THEN '-' || public.slugify(fac_city)
           ELSE ''
         END
      || '-' || substr(replace(fac_id::text, '-', ''), 1, 6)
    )
    WHERE id = fac_id
      AND (slug IS NULL OR btrim(slug) = '');
  ELSE
    SELECT f.id, f.organization_id
      INTO fac_id, org_id
    FROM public.facilities f
    WHERE f.id = _facility_id;

    IF fac_id IS NULL THEN
      RAISE EXCEPTION 'Facility not found';
    END IF;

    IF org_id <> _organization_id THEN
      RAISE EXCEPTION 'Facility does not belong to organization'
        USING ERRCODE = '42501';
    END IF;

    UPDATE public.facilities
    SET
      name = fac_name,
      tagline = fac_tagline,
      address_line1 = fac_address,
      city = fac_city,
      state = fac_state,
      zip = fac_zip,
      phone = fac_phone,
      website = fac_website,
      description = fac_description,
      capacity = fac_capacity,
      levels_of_care = fac_levels,
      highlights = fac_highlights,
      population_served = fac_population,
      specializations = fac_specializations,
      accreditations = fac_accreditations,
      image_urls = fac_images,
      bd_contact_name = fac_bd_name,
      bd_contact_phone = fac_bd_phone,
      bd_contact_email = fac_bd_email,
      hidden_from_org_page = CASE
        WHEN has_hidden_key THEN fac_hidden
        ELSE public.facilities.hidden_from_org_page
      END,
      slug = CASE
        WHEN slug IS NULL OR btrim(slug) = '' THEN trim(both '-' from
          public.slugify(fac_name)
          || CASE
               WHEN fac_city IS NOT NULL THEN '-' || public.slugify(fac_city)
               ELSE ''
             END
          || '-' || substr(replace(id::text, '-', ''), 1, 6)
        )
        ELSE slug
      END,
      updated_at = now()
    WHERE id = fac_id;
  END IF;

  IF mode = 'all' THEN
    DELETE FROM public.insurance_contracts WHERE facility_id = fac_id;
  ELSIF mode = 'in_network' THEN
    DELETE FROM public.insurance_contracts
    WHERE facility_id = fac_id AND in_network = true;
  END IF;

  IF mode IN ('all', 'in_network') THEN
    FOR rec IN SELECT value FROM jsonb_array_elements(COALESCE(_contracts, '[]'::jsonb))
    LOOP
      payer_name_val := nullif(trim(coalesce(rec->>'payer_name', '')), '');
      IF payer_name_val IS NULL OR char_length(payer_name_val) > 200 THEN
        RAISE EXCEPTION 'Each contract needs a payer name (max 200 characters)';
      END IF;

      payer_id_val := NULL;
      IF nullif(trim(coalesce(rec->>'payer_id', '')), '') IS NOT NULL THEN
        BEGIN
          payer_id_val := (rec->>'payer_id')::uuid;
        EXCEPTION WHEN others THEN
          RAISE EXCEPTION 'Invalid payer_id';
        END;
      END IF;

      in_network_val := CASE
        WHEN mode = 'in_network' THEN true
        ELSE COALESCE((rec->>'in_network')::boolean, true)
      END;

      INSERT INTO public.insurance_contracts (
        facility_id,
        payer_id,
        payer_name,
        in_network
      ) VALUES (
        fac_id,
        payer_id_val,
        payer_name_val,
        in_network_val
      );
    END LOOP;
  END IF;

  RETURN fac_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_facility_with_contracts(uuid, jsonb, jsonb, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_facility_with_contracts(uuid, jsonb, jsonb, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Validated organization profile updates (non-billing fields only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_organization_profile(
  _organization_id uuid,
  _profile jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  org_name text;
  website text;
  brand text;
  accent text;
  email_val text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _organization_id IS NULL OR _profile IS NULL OR jsonb_typeof(_profile) <> 'object' THEN
    RAISE EXCEPTION 'Invalid organization profile payload';
  END IF;

  IF NOT (
    public.has_role(uid, 'super_admin'::public.app_role)
    OR public.is_org_facility_admin(_organization_id, uid)
  ) THEN
    RAISE EXCEPTION 'Only organization admins can update organization profile'
      USING ERRCODE = '42501';
  END IF;

  org_name := nullif(trim(coalesce(_profile->>'name', '')), '');
  IF org_name IS NULL OR char_length(org_name) > 200 THEN
    RAISE EXCEPTION 'Organization name is required (max 200 characters)';
  END IF;

  website := nullif(trim(coalesce(_profile->>'website', '')), '');
  IF website IS NOT NULL AND (
    char_length(website) > 500
    OR website ~* '^\s*(javascript|data):'
  ) THEN
    RAISE EXCEPTION 'Website URL is invalid';
  END IF;

  email_val := nullif(trim(coalesce(_profile->>'bd_contact_email', '')), '');
  IF email_val IS NOT NULL AND (
    char_length(email_val) > 254
    OR email_val !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) THEN
    RAISE EXCEPTION 'BD contact email is invalid';
  END IF;

  brand := nullif(trim(coalesce(_profile->>'brand_color', '')), '');
  accent := nullif(trim(coalesce(_profile->>'accent_color', '')), '');
  IF brand IS NOT NULL AND brand !~* '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$' THEN
    RAISE EXCEPTION 'brand_color must be a hex color';
  END IF;
  IF accent IS NOT NULL AND accent !~* '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$' THEN
    RAISE EXCEPTION 'accent_color must be a hex color';
  END IF;

  UPDATE public.organizations
  SET
    name = org_name,
    description = nullif(trim(coalesce(_profile->>'description', '')), ''),
    website = website,
    hq_city = nullif(trim(coalesce(_profile->>'hq_city', '')), ''),
    hq_state = nullif(trim(coalesce(_profile->>'hq_state', '')), ''),
    logo_url = nullif(trim(coalesce(_profile->>'logo_url', '')), ''),
    footer_image_url = nullif(trim(coalesce(_profile->>'footer_image_url', '')), ''),
    social_facebook_url = nullif(trim(coalesce(_profile->>'social_facebook_url', '')), ''),
    social_instagram_url = nullif(trim(coalesce(_profile->>'social_instagram_url', '')), ''),
    social_linkedin_url = nullif(trim(coalesce(_profile->>'social_linkedin_url', '')), ''),
    social_x_url = nullif(trim(coalesce(_profile->>'social_x_url', '')), ''),
    bd_contact_name = nullif(trim(coalesce(_profile->>'bd_contact_name', '')), ''),
    bd_contact_phone = nullif(trim(coalesce(_profile->>'bd_contact_phone', '')), ''),
    bd_contact_email = email_val,
    tagline = nullif(trim(coalesce(_profile->>'tagline', '')), ''),
    brand_color = brand,
    accent_color = accent,
    cover_image_url = nullif(trim(coalesce(_profile->>'cover_image_url', '')), ''),
    image_urls = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(_profile->'image_urls', '[]'::jsonb))),
      ARRAY[]::text[]
    ),
    announcement = nullif(trim(coalesce(_profile->>'announcement', '')), ''),
    program_badges = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(_profile->'program_badges', '[]'::jsonb))),
      ARRAY[]::text[]
    ),
    cta_primary_label = nullif(trim(coalesce(_profile->>'cta_primary_label', '')), ''),
    cta_secondary_label = nullif(trim(coalesce(_profile->>'cta_secondary_label', '')), ''),
    why_refer = COALESCE(_profile->'why_refer', '[]'::jsonb),
    updated_at = now()
  WHERE id = _organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_organization_profile(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_organization_profile(uuid, jsonb) TO authenticated;
