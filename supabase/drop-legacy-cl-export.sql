-- One-off: drop leftover live-DB catalog export objects.
-- cl_export / cl_csv are SECURITY DEFINER views with no RLS and SELECT
-- granted to anon/authenticated. They dump facility address, phone, BD
-- contacts, and insurance. The cl_* / q(text) helpers exist only for
-- those views and are unused by the app.
-- Do not use LIKE 'cl_%' — '_' is a Postgres wildcard and would match
-- claim_pending_org_invite. Drop only the named objects below.

DROP VIEW IF EXISTS public.cl_csv;
DROP VIEW IF EXISTS public.cl_export;

DROP FUNCTION IF EXISTS public.cl_abbr(text);
DROP FUNCTION IF EXISTS public.cl_loc(text);
DROP FUNCTION IF EXISTS public.cl_payer(text);
DROP FUNCTION IF EXISTS public.cl_rank(text);
DROP FUNCTION IF EXISTS public.cl_spec(text);
DROP FUNCTION IF EXISTS public.cl_state(text);
DROP FUNCTION IF EXISTS public.q(text);
