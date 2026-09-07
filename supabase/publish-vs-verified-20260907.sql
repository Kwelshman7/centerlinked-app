-- Split public visibility from the verification trust claim (7 Sep 2026).
-- Paste into the Supabase SQL Editor. Idempotent.
--
-- Why: `organizations.verified` was doing two unrelated jobs — it gated whether
-- a public sheet resolves at all, AND it renders the "Verified — last updated"
-- mark next to the CenterLinked logo. That meant an unclaimed, admin-seeded
-- profile could only be made visible by asserting it was verified, which is a
-- trust claim we cannot make on behalf of a company that never confirmed it.
--
-- After this:
--   is_published  -> may anyone load this sheet?          (visibility)
--   verified      -> did the organization confirm it?     (trust claim)
--
-- This migration is behaviour-preserving on its own: is_published is backfilled
-- from verified, so exactly the same sheets resolve as before. Publishing
-- unclaimed profiles is a separate, deliberate step taken only once the UI
-- renders an honest "unclaimed" treatment.
--
-- 1) Column + behaviour-preserving backfill
-- 2) Read grants and the anon visibility policy
-- 3) Repoint get_public_org_sheet / get_public_program_sheet
-- 4) Write-lock is_published to super_admin (mirrors organizations.verified)

-- ---------------------------------------------------------------------------
-- 1) Column + backfill
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Behaviour-preserving: whatever resolved publicly before still resolves now.
-- Only runs while the column is still entirely at its default.
UPDATE public.organizations
SET is_published = true
WHERE verified = true
  AND is_published = false
  AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE is_published = true);

COMMENT ON COLUMN public.organizations.is_published IS
  'Public sheet resolves. Independent of verified, which is the trust claim.';

-- ---------------------------------------------------------------------------
-- 2) Grants + anon visibility policy
-- ---------------------------------------------------------------------------
GRANT SELECT (is_published) ON public.organizations TO anon, authenticated;

DROP POLICY IF EXISTS "anon can view verified organizations" ON public.organizations;
DROP POLICY IF EXISTS "anon can view published organizations" ON public.organizations;
CREATE POLICY "anon can view published organizations"
ON public.organizations
FOR SELECT
TO anon
USING (is_published = true);

-- ---------------------------------------------------------------------------
-- 3) Repoint the public sheet RPCs
-- ---------------------------------------------------------------------------
-- Rewritten from pg_get_functiondef rather than restated by hand: these are
-- SECURITY DEFINER and ~3.7 KB each, so retyping them risks silently dropping a
-- filter. Both guards below abort the migration if the source is not shaped the
-- way this migration was written against.
DO $do$
DECLARE
  fn text;
  src text;
  gate_hits int;
BEGIN
  FOREACH fn IN ARRAY ARRAY['get_public_org_sheet', 'get_public_program_sheet'] LOOP
    SELECT pg_get_functiondef(p.oid) INTO src
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = fn
    LIMIT 1;

    IF src IS NULL THEN
      RAISE EXCEPTION 'public.% not found', fn;
    END IF;

    IF position('o.is_published = true' IN src) > 0 THEN
      RAISE NOTICE '%: already repointed, skipping', fn;
      CONTINUE;
    END IF;

    gate_hits := (length(src) - length(replace(src, 'o.verified = true', '')))
                 / length('o.verified = true');
    IF gate_hits <> 1 THEN
      RAISE EXCEPTION '%: expected exactly 1 "o.verified = true" gate, found %', fn, gate_hits;
    END IF;

    -- Visibility gate moves to is_published.
    src := replace(src, 'o.verified = true', 'o.is_published = true');

    -- Expose both flags so the client can render an honest unclaimed state.
    src := replace(
      src,
      $q$'verified', o.verified$q$,
      $q$'verified', o.verified, 'is_published', o.is_published$q$
    );

    EXECUTE src;
    RAISE NOTICE '%: repointed to is_published', fn;
  END LOOP;
END
$do$;

-- ---------------------------------------------------------------------------
-- 4) Write-lock is_published (mirrors protect_organization_verified_column)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_is_published_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_published IS NOT DISTINCT FROM OLD.is_published THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND COALESCE(NEW.is_published, false) = false THEN
    RETURN NEW;
  END IF;

  IF public.db_session_is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'organizations.is_published is read-only'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_is_published_column ON public.organizations;
CREATE TRIGGER protect_organization_is_published_column
  BEFORE INSERT OR UPDATE OF is_published ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_is_published_column();

REVOKE ALL ON FUNCTION public.protect_organization_is_published_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_organization_is_published_column() FROM anon, authenticated;
