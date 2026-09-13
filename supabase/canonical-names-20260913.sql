-- Canonical insurance parent/aliases + accreditation catalog.
-- Additive and reversible. Does not rewrite facilities.accreditations
-- or merge Anthem into Blue Cross Blue Shield.
--
-- Rollback:
--   UPDATE public.payers SET parent_company = NULL
--     WHERE id IN (SELECT record_id FROM public.normalization_change_log
--                  WHERE domain = 'payer' AND action = 'parent_set');
--   DROP TABLE IF EXISTS public.normalization_change_log;
--   DROP TABLE IF EXISTS public.accreditation_bodies;

CREATE TABLE IF NOT EXISTS public.accreditation_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  kind text NOT NULL DEFAULT 'accreditation'
    CHECK (kind IN ('accreditation', 'license', 'membership', 'other')),
  aliases text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.normalization_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL CHECK (domain IN ('payer', 'accreditation')),
  action text NOT NULL,
  source_label text NOT NULL,
  target_slug text,
  target_name text,
  record_id uuid,
  facility_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.accreditation_bodies IS
  'Canonical accreditation/license/membership names. Facility text[] stays the original imported value.';
COMMENT ON TABLE public.normalization_change_log IS
  'Audit of Phase 2 canonical mapping. Uncertain labels are action=review and were not changed.';

ALTER TABLE public.accreditation_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normalization_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accreditation bodies are readable" ON public.accreditation_bodies;
CREATE POLICY "Accreditation bodies are readable"
  ON public.accreditation_bodies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins manage accreditation bodies" ON public.accreditation_bodies;
CREATE POLICY "Super admins manage accreditation bodies"
  ON public.accreditation_bodies FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Super admins read normalization log" ON public.normalization_change_log;
CREATE POLICY "Super admins read normalization log"
  ON public.normalization_change_log FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

GRANT SELECT ON public.accreditation_bodies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accreditation_bodies TO service_role;
GRANT SELECT ON public.normalization_change_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.normalization_change_log TO service_role;

INSERT INTO public.accreditation_bodies (slug, canonical_name, kind, aliases)
VALUES
  ('joint-commission', 'Joint Commission', 'accreditation',
    ARRAY['JCAHO','The Joint Commission','Joint Commission (JCAHO)','JCAHO (Joint Commission)','Joint Commission (TJC)','TJC','Joint Commission Gold Seal','The Joint Commission (Gold Seal)','The Joint Commission (Gold Seal of Approval)']),
  ('carf', 'CARF', 'accreditation', ARRAY['CARF Accredited','CARF International','CARF (3-year)']),
  ('legitscript', 'LegitScript', 'accreditation', ARRAY['LegitScript Certified']),
  ('farr', 'FARR', 'accreditation', ARRAY['FARR Certified']),
  ('naatp', 'NAATP', 'membership', ARRAY['NAATP Member']),
  ('dcf', 'DCF', 'license', ARRAY['DCF Licensed','Florida DCF']),
  ('narr', 'NARR', 'accreditation', ARRAY['National Alliance of Recovery Residences']),
  ('state-licensed', 'State licensed', 'license', ARRAY['State-licensed','State Licensed']),
  ('dhcs', 'DHCS', 'license', ARRAY['DHCS Licensed']),
  ('ahca', 'AHCA', 'license', ARRAY[]::text[]),
  ('psych-armor', 'Psych Armor', 'other', ARRAY['Psych Armor (Veteran-Ready)']),
  ('naadac', 'NAADAC', 'membership', ARRAY[]::text[]),
  ('natsap', 'NATSAP', 'membership', ARRAY[]::text[])
ON CONFLICT (slug) DO UPDATE
SET canonical_name = EXCLUDED.canonical_name,
    kind = EXCLUDED.kind,
    aliases = EXCLUDED.aliases,
    updated_at = now();

-- Parent company only. Does not change payer ids or contract rows.
UPDATE public.payers
SET parent_company = 'Elevance Health', updated_at = now()
WHERE name IN ('Anthem Blue Cross Blue Shield', 'Anthem Blue Cross of California')
  AND parent_company IS NULL;

UPDATE public.payers
SET parent_company = 'Blue Cross Blue Shield', updated_at = now()
WHERE parent_company IS NULL
  AND name IN (
    'Horizon Blue Cross Blue Shield of New Jersey',
    'Empire Blue Cross Blue Shield',
    'Highmark Blue Cross Blue Shield',
    'CareFirst BlueCross BlueShield',
    'Florida Blue',
    'Wellmark Blue Cross Blue Shield',
    'Excellus BlueCross BlueShield',
    'Independence Blue Cross',
    'Premera Blue Cross',
    'Regence BlueShield',
    'Capital BlueCross',
    'Blue Cross Blue Shield of Alabama',
    'Blue Cross Blue Shield of Arizona',
    'Blue Cross Blue Shield of Illinois',
    'Blue Cross Blue Shield of Kansas City',
    'Blue Cross Blue Shield of Louisiana',
    'Blue Cross Blue Shield of Massachusetts',
    'Blue Cross Blue Shield of Michigan',
    'Blue Cross Blue Shield of Minnesota',
    'Blue Cross Blue Shield of Nebraska',
    'Blue Cross Blue Shield of North Carolina',
    'Blue Cross Blue Shield of South Carolina',
    'Blue Cross Blue Shield of Tennessee',
    'Blue Cross Blue Shield of Texas',
    'Blue Cross Blue Shield of Vermont',
    'Blue Cross Blue Shield of Wyoming',
    'Blue Shield of California'
  );

UPDATE public.payers
SET aliases = ARRAY(
      SELECT DISTINCT trim(a)
      FROM unnest(aliases || ARRAY['Blue Cross Blue Shield Association']) AS a
      WHERE btrim(a) <> ''
    ),
    updated_at = now()
WHERE name = 'Blue Cross Blue Shield'
  AND NOT ('Blue Cross Blue Shield Association' = ANY (aliases));

INSERT INTO public.normalization_change_log (domain, action, source_label, target_name, record_id, notes)
SELECT
  'payer',
  'parent_set',
  name,
  parent_company,
  id,
  'Set parent_company only. Search and display still use this payer name.'
FROM public.payers
WHERE parent_company IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.normalization_change_log l
    WHERE l.record_id = payers.id AND l.action = 'parent_set'
  );

INSERT INTO public.normalization_change_log (domain, action, source_label, target_slug, target_name, facility_id, notes)
SELECT DISTINCT ON (f.id, btrim(label))
  'accreditation',
  CASE
    WHEN lower(btrim(label)) ~ '^(asam|loc[[:space:]]+[0-9])' THEN 'review'
    WHEN lower(btrim(label)) ~ '^[0-9]+[[:space:]]+(licenses|licenses & certifications|licenses and certifications)' THEN 'review'
    WHEN lower(btrim(label)) LIKE '%psychology today%' THEN 'review'
    WHEN body.slug IS NULL THEN 'review'
    ELSE 'mapped'
  END,
  btrim(label),
  body.slug,
  body.canonical_name,
  f.id,
  CASE
    WHEN lower(btrim(label)) ~ '^(asam|loc[[:space:]]+[0-9])' THEN 'Looks like a level of care, not an accreditation'
    WHEN lower(btrim(label)) ~ '^[0-9]+[[:space:]]+(licenses|licenses & certifications|licenses and certifications)' THEN 'Count of licenses, not a named body'
    WHEN lower(btrim(label)) LIKE '%psychology today%' THEN 'Directory listing, not an accreditation'
    WHEN body.slug IS NULL THEN 'No canonical match. Original facility text was not changed.'
    ELSE 'Resolved to canonical body. facilities.accreditations text was not overwritten.'
  END
FROM public.facilities f
CROSS JOIN LATERAL unnest(COALESCE(f.accreditations, '{}')) AS label
LEFT JOIN public.accreditation_bodies body
  ON (
    lower(btrim(label)) = lower(body.canonical_name)
    OR lower(btrim(label)) = ANY (SELECT lower(a) FROM unnest(body.aliases) AS a)
    OR (
      body.slug = 'joint-commission'
      AND (
        lower(btrim(label)) IN ('jcaho', 'tjc')
        OR lower(btrim(label)) LIKE '%joint commission%'
      )
    )
    OR (body.slug = 'carf' AND lower(btrim(label)) LIKE 'carf%')
    OR (body.slug = 'legitscript' AND lower(btrim(label)) LIKE 'legitscript%')
    OR (body.slug = 'farr' AND lower(btrim(label)) LIKE 'farr%')
    OR (body.slug = 'naatp' AND lower(btrim(label)) LIKE 'naatp%')
    OR (body.slug = 'dhcs' AND lower(btrim(label)) LIKE 'dhcs%')
    OR (body.slug = 'psych-armor' AND lower(btrim(label)) LIKE 'psych armor%')
    OR (body.slug = 'dcf' AND lower(btrim(label)) IN ('dcf', 'dcf licensed', 'florida dcf'))
    OR (body.slug = 'narr' AND (
      lower(btrim(label)) = 'narr'
      OR lower(btrim(label)) LIKE '%national alliance of recovery residences%'
    ))
    OR (body.slug = 'state-licensed' AND lower(btrim(label)) IN ('state licensed', 'state-licensed'))
  )
WHERE btrim(label) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.normalization_change_log l
    WHERE l.domain = 'accreditation'
      AND l.facility_id = f.id
      AND l.source_label = btrim(label)
  )
ORDER BY f.id, btrim(label), body.slug NULLS LAST;

INSERT INTO public.normalization_change_log (domain, action, source_label, notes)
SELECT
  'payer',
  'review',
  c.payer_name,
  'Unlinked contract label. Not auto-assigned.'
FROM public.insurance_contracts c
WHERE c.payer_id IS NULL
  AND btrim(c.payer_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.normalization_change_log l
    WHERE l.domain = 'payer' AND l.action = 'review' AND l.source_label = c.payer_name
  )
GROUP BY c.payer_name;
