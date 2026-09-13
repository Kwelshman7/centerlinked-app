-- Normalized insurance-contract fields + facility self-pay flag.
-- Additive and reversible. Does not invent contracts or delete rows.
--
-- Apply after (or with) the updated save_facility_with_contracts in
-- supabase/save-facility-with-contracts.sql so replace-mode saves keep
-- verification / original-import metadata.
--
-- Rollback:
--   ALTER TABLE public.facilities DROP COLUMN IF EXISTS self_pay_only;
--   ALTER TABLE public.insurance_contracts
--     DROP COLUMN IF EXISTS contract_status,
--     DROP COLUMN IF EXISTS network_name,
--     DROP COLUMN IF EXISTS levels_of_care_covered,
--     DROP COLUMN IF EXISTS covered_states,
--     DROP COLUMN IF EXISTS effective_date,
--     DROP COLUMN IF EXISTS termination_date,
--     DROP COLUMN IF EXISTS verified_at,
--     DROP COLUMN IF EXISTS verified_by,
--     DROP COLUMN IF EXISTS verification_method,
--     DROP COLUMN IF EXISTS internal_notes,
--     DROP COLUMN IF EXISTS original_imported_value;
--   Then restore the previous save_facility_with_contracts definition.

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS self_pay_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.facilities.self_pay_only IS
  'Admin-set. Facility reports self-pay only. Missing insurance rows still mean unknown, not out of network.';

ALTER TABLE public.insurance_contracts
  ADD COLUMN IF NOT EXISTS contract_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS network_name text,
  ADD COLUMN IF NOT EXISTS levels_of_care_covered text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS covered_states text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS effective_date date,
  ADD COLUMN IF NOT EXISTS termination_date date,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verification_method text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS original_imported_value text;

ALTER TABLE public.insurance_contracts
  DROP CONSTRAINT IF EXISTS insurance_contracts_status_check;
ALTER TABLE public.insurance_contracts
  ADD CONSTRAINT insurance_contracts_status_check
  CHECK (contract_status IN (
    'active',
    'inactive',
    'pending_verification',
    'unknown',
    'out_of_network'
  ));

ALTER TABLE public.insurance_contracts
  DROP CONSTRAINT IF EXISTS insurance_contracts_verification_method_check;
ALTER TABLE public.insurance_contracts
  ADD CONSTRAINT insurance_contracts_verification_method_check
  CHECK (
    verification_method IS NULL
    OR verification_method IN (
      'bd_confirmation',
      'payer_portal',
      'contract_document',
      'phone',
      'email',
      'other'
    )
  );

-- Map the existing boolean only. Do not invent verification timestamps.
UPDATE public.insurance_contracts
SET contract_status = 'active'
WHERE in_network = true
  AND contract_status = 'unknown';

UPDATE public.insurance_contracts
SET contract_status = 'out_of_network'
WHERE in_network = false
  AND contract_status = 'unknown';

UPDATE public.insurance_contracts
SET original_imported_value = payer_name
WHERE original_imported_value IS NULL
  AND payer_name IS NOT NULL
  AND btrim(payer_name) <> '';

CREATE INDEX IF NOT EXISTS insurance_contracts_facility_status_idx
  ON public.insurance_contracts (facility_id, contract_status);

CREATE INDEX IF NOT EXISTS insurance_contracts_payer_status_idx
  ON public.insurance_contracts (payer_id, contract_status)
  WHERE payer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS facilities_self_pay_only_idx
  ON public.facilities (id)
  WHERE self_pay_only = true;

COMMENT ON COLUMN public.insurance_contracts.contract_status IS
  'active | inactive | pending_verification | unknown | out_of_network. Absence of a row is unknown, not OON.';
COMMENT ON COLUMN public.insurance_contracts.internal_notes IS
  'Admin/org only. Never select on public sheets.';
COMMENT ON COLUMN public.insurance_contracts.original_imported_value IS
  'Source label at import or first save. Do not overwrite when linking a canonical payer.';
COMMENT ON COLUMN public.insurance_contracts.verified_at IS
  'Set only when this contract was actually verified. Facility stamps do not backfill this.';
