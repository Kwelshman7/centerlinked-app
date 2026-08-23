-- Monthly contract freeze + due-list RPCs (audit P2).
-- Cadence matches src/lib/verification.ts: fresh ≤30d, recent 31-60d,
-- stale 61-90d, freeze when last stamp is older than 90 days.
-- Never-stamped facilities stay unfrozen (tier "never"), not frozen.
--
-- Apply after column-write-locks.sql.
-- Run: paste into Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/freeze-stale-facilities.sql
--
-- Schedule (do not expose an anonymous HTTP freeze endpoint).
-- pg_cron runs as the database owner, not anon. Idempotent re-apply is safe.
-- UTC 08:15 daily. Alternative: GitHub Actions / Render with service-role
-- POST /rest/v1/rpc/freeze_stale_facilities.
--
-- EXECUTE is service_role only. Anon was able to freeze the catalog (Phase 0).

CREATE OR REPLACE FUNCTION public.freeze_stale_facilities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.facilities
  SET
    verification_frozen = true,
    updated_at = now()
  WHERE verification_status = 'approved'::public.verification_status
    AND COALESCE(verification_frozen, false) = false
    AND contracts_verified_at IS NOT NULL
    AND contracts_verified_at < (timezone('utc', now()) - interval '90 days');

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.freeze_stale_facilities() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.freeze_stale_facilities() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.freeze_stale_facilities() TO service_role;

-- Live function used a different OUT column order; CREATE OR REPLACE cannot change it.
DROP FUNCTION IF EXISTS public.list_facilities_due_for_verification(integer);

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

-- Daily freeze. pg_cron is available on this project; the job runs as the
-- database owner (not anon). Re-apply unschedules the same job name first.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'freeze-stale-facilities-daily';

SELECT cron.schedule(
  'freeze-stale-facilities-daily',
  '15 8 * * *',
  $$select public.freeze_stale_facilities()$$
);
