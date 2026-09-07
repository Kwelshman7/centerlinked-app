-- Persist insurance plan-type claims on save_facility_with_contracts (7 Sep 2026).
-- Paste into the Supabase SQL Editor. Idempotent.
--
-- Why: `insurance_contracts.plan_types` already exists but the RPC only inserts
-- payer_id / payer_name / in_network. Search and public sheets therefore cannot
-- tell Cigna PPO from Cigna Medicare Advantage.
--
-- After this:
--   Each contract JSON may include `plan_types` (known slugs only).
--   Empty / missing / unknown values store as {}.
--   get_public_program_sheet exposes plan_types for the facility sheet.
--
-- Does not backfill existing rows. Unspecified stays unspecified.
-- Does not change RLS.

-- ---------------------------------------------------------------------------
-- 1) save_facility_with_contracts: accept and insert plan_types
-- ---------------------------------------------------------------------------
DO $do$
DECLARE
  src text;
  insert_old text := $q$
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
      );$q$;
  insert_new text := $q$
      plan_types_val := ARRAY[]::text[];
      IF jsonb_typeof(rec->'plan_types') = 'array' THEN
        plan_types_val := ARRAY(
          SELECT DISTINCT lower(trim(elem))
          FROM jsonb_array_elements_text(rec->'plan_types') AS elem
          WHERE lower(trim(elem)) IN (
            'ppo',
            'hmo',
            'epo',
            'pos',
            'marketplace',
            'medicare_advantage',
            'medicare_traditional',
            'medicaid_mco',
            'medicaid_ffs',
            'tricare_prime',
            'tricare_select'
          )
        );
      END IF;

      INSERT INTO public.insurance_contracts (
        facility_id,
        payer_id,
        payer_name,
        in_network,
        plan_types
      ) VALUES (
        fac_id,
        payer_id_val,
        payer_name_val,
        in_network_val,
        COALESCE(plan_types_val, ARRAY[]::text[])
      );$q$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO src
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'save_facility_with_contracts'
  LIMIT 1;

  IF src IS NULL THEN
    RAISE EXCEPTION 'public.save_facility_with_contracts not found';
  END IF;

  IF position('plan_types_val' IN src) > 0 THEN
    RAISE NOTICE 'save_facility_with_contracts: already persists plan_types, skipping';
    RETURN;
  END IF;

  IF position('in_network_val boolean;' IN src) = 0 THEN
    RAISE EXCEPTION 'save_facility_with_contracts: unexpected source (missing in_network_val)';
  END IF;

  IF position(insert_old IN src) = 0 THEN
    RAISE EXCEPTION 'save_facility_with_contracts: unexpected INSERT loop — aborting';
  END IF;

  src := replace(src, 'in_network_val boolean;', E'in_network_val boolean;\n  plan_types_val text[];');
  src := replace(src, insert_old, insert_new);

  EXECUTE src;
  RAISE NOTICE 'save_facility_with_contracts: now persists plan_types';
END
$do$;

-- ---------------------------------------------------------------------------
-- 2) get_public_program_sheet: expose claimed plan types
-- ---------------------------------------------------------------------------
DO $do$
DECLARE
  src text;
  old_contracts text := $q$'id', c.id,
        'payer_id', c.payer_id,
        'payer_name', c.payer_name,
        'in_network', c.in_network$q$;
  new_contracts text := $q$'id', c.id,
        'payer_id', c.payer_id,
        'payer_name', c.payer_name,
        'in_network', c.in_network,
        'plan_types', c.plan_types$q$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO src
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_public_program_sheet'
  LIMIT 1;

  IF src IS NULL THEN
    RAISE EXCEPTION 'public.get_public_program_sheet not found';
  END IF;

  IF position('c.plan_types' IN src) > 0 THEN
    RAISE NOTICE 'get_public_program_sheet: already exposes plan_types, skipping';
    RETURN;
  END IF;

  IF position(old_contracts IN src) = 0 THEN
    RAISE EXCEPTION 'get_public_program_sheet: unexpected contracts object — aborting';
  END IF;

  src := replace(src, old_contracts, new_contracts);
  EXECUTE src;
  RAISE NOTICE 'get_public_program_sheet: now exposes plan_types';
END
$do$;
