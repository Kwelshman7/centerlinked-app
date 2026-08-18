-- Read-only live-DB inspection for the 16 Aug 2026 audit apply-state.
-- Paste into Supabase SQL Editor. Does not write.
-- Compare results to supabase/migrations/00000000000000_rls_policy_snapshot.json
-- and the hardening files listed in migrations/20260802120000_production_security_bundle.sql.

-- ---------------------------------------------------------------------------
-- 1) Tables that hardening SQL creates
-- ---------------------------------------------------------------------------
SELECT
  to_regclass('public.stripe_webhook_events') AS stripe_webhook_events,
  to_regclass('public.access_request_rate_limits') AS access_request_rate_limits,
  to_regclass('public.bootstrap_admin_emails') AS bootstrap_admin_emails;

-- ---------------------------------------------------------------------------
-- 2) Functions the audit cares about
-- ---------------------------------------------------------------------------
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'freeze_stale_facilities',
    'list_facilities_due_for_verification',
    'consume_access_request_rate_limit',
    'protect_organization_billing_columns',
    'protect_facility_privileged_columns',
    'protect_organization_verified_column',
    'protect_organization_member_role',
    'protect_org_invite_role',
    'protect_profile_organization_id',
    'stamp_facility_verified',
    'run_sql',
    'link_user_to_organization',
    'save_facility_with_contracts',
    'claim_pending_org_invite',
    'remove_org_member',
    'create_org_invite',
    'revoke_org_invite',
    'is_email_auth_allowed'
  )
ORDER BY p.proname, args;

-- ---------------------------------------------------------------------------
-- 3) EXECUTE grants (anon/authenticated must not have run_sql or freeze)
-- ---------------------------------------------------------------------------
SELECT
  r.routine_name,
  r.grantee,
  r.privilege_type
FROM information_schema.routine_privileges r
WHERE r.specific_schema = 'public'
  AND r.routine_name IN (
    'run_sql',
    'link_user_to_organization',
    'freeze_stale_facilities',
    'consume_access_request_rate_limit',
    'is_email_auth_allowed',
    'save_facility_with_contracts',
    'stamp_facility_verified',
    'claim_pending_org_invite',
    'remove_org_member'
  )
  AND r.grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY r.routine_name, r.grantee;

-- ---------------------------------------------------------------------------
-- 4) Triggers on privileged tables
-- ---------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  t.tgname,
  p.proname AS function_name,
  t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND c.relname IN (
    'organizations',
    'facilities',
    'profiles',
    'organization_members',
    'org_invites'
  )
ORDER BY c.relname, t.tgname;

-- ---------------------------------------------------------------------------
-- 5) RLS policies vs snapshot / hardening names
-- ---------------------------------------------------------------------------
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'profiles',
    'facilities',
    'organization_members',
    'org_invites',
    'early_access_leads',
    'organization_claims',
    'user_roles',
    'stripe_webhook_events',
    'access_request_rate_limits'
  )
ORDER BY tablename, policyname;

-- Expected hardening markers (true = applied):
--   organizations: policy "anon can view verified organizations"
--   organizations: policy "authenticated view verified or member orgs"
--   profiles: policy "users view own org or admin profiles"
--   early_access_leads: NO policy "anyone submits leads" / "early_access_leads_public_insert"
--   organization_claims: NO policy "Anyone can submit a claim"
--   stripe_webhook_events: RLS on, no anon/authenticated policies
--   user_roles: policy "user_roles_insert_super_admin_only"
