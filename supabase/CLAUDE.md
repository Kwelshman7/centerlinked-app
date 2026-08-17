# supabase/ — SQL, RLS, RPCs

Postgres is the system of record. Client correctness depends on RLS and SECURITY DEFINER RPCs, not UI hiding.

Do **not** guess schema. Read `DATABASE.md`, `src/integrations/supabase/types.ts`, and the specific `.sql` file. Types and the RLS snapshot can lag the live project. One-off files here are not proof they were applied.

## Layout

- `*.sql` — operational scripts (billing, RLS, joins, facility save, allowlists)
- `migrations/20260802120000_production_security_bundle.sql` — ordered apply checklist
- `migrations/00000000000000_rls_policy_snapshot.json` — captured policy inventory (~75 policies)

## Rules for this tree

- Do not add/alter tables, columns, enums, indexes, triggers, RLS, or RPCs unless the user explicitly asked.
- Prefer extending an existing SECURITY DEFINER RPC over a new client-side multi-step write.
- Critical write path: `save-facility-with-contracts.sql`. Do not change its arguments or transaction assumptions casually.
- Authz helpers used in policies: `has_role`, `is_org_member`, `is_org_facility_admin`. Weakening these is a cross-tenant leak.
- Billing columns on `organizations` are protected by trigger; only service role / webhook should write them.
- `run_sql` and client EXECUTE on `link_user_to_organization` are revoked on purpose (`revoke-dangerous-grants.sql`).
- Tables used in app/SQL but missing from `types.ts`: `bootstrap_admin_emails`, `facility_pdf_uploads`, `access_request_rate_limits`. Do not invent their shapes — read the SQL that defines them.
- If schema work is requested: state impact on RLS, RPCs, `types.ts`, public sheets, and rollback **before** editing.

Edge Functions (`track-org-event`, `parse-facility-pdf`, `extract-pdf-images`) are invoked from the app; their source is not in `api/`. Do not assume you can edit them here.
