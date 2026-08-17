# CenterLinked — Agent Instructions

Production B2B referral platform for behavioral-health / addiction-treatment organizations. Domain: https://www.centerlinked.com. Not a patient-facing directory. No PHI.

This file is the session entry point. Full product/architecture/schema live in the docs below — do not duplicate them into new markdown unless asked.

**Never guess. Never invent schema, routes, env, or product policy.** If it is not in the repo or the user message, ask. Optimize for the product: a trustworthy live referral link for treatment-org BD teams — not a consumer directory, patient portal, or social network. Details: `PRINCIPLES.md`.

## Read first

| Doc | Use it for |
|-----|------------|
| `AGENTS.md` | Short always-on agent contract (Cursor and other tools) |
| `PRINCIPLES.md` | Product intent, what we are not, never-guess rules |
| `CODING_STANDARDS.md` | How to write code in this repo |
| `AI_RULES.md` | Mandatory working rules (scope, safety, checklists) |
| `PROJECT.md` | Product, users, stack, env, status, limitations |
| `ARCHITECTURE.md` | Systems, routes, data flow, blast radius |
| `DATABASE.md` | Tables, RPCs, RLS, storage, schema drift notes |

Area guides (read when working in that tree): `src/CLAUDE.md`, `server/CLAUDE.md`, `api/CLAUDE.md`, `supabase/CLAUDE.md`.

## Stack

Vite 5 + React 18 + TypeScript (not strict) + React Router 6 + Tailwind 3 + shadcn/ui. Supabase (Auth, Postgres + RLS, Storage, Edge Functions). Stripe Checkout/Portal/webhooks. Resend. Deployed on **Vercel** (SPA + `api/` serverless + `middleware.js`). Path alias `@/` → `src/`. Package manager: **npm**.

Local API parity is Vite plugins (`vite-plugin-*.ts`) calling the same `server/**` handlers as `api/*.js`. There is no Next.js and no Server Actions.

## Commands

```bash
npm install
npm run dev          # Vite on port 8080 (strictPort)
npm run build
npm run lint
```

Ops scripts (service-role / process env; `--apply` writes production data):

```bash
npm run facility-images
npm run facility-images:status
npm run facility-images:apply
npm run backfill-payer-ids
npm run seed-missing-payers
npm run approve-all-facilities
npm run reconcile-contracts
npm run reconcile-contracts:apply
```

## How to work

1. Smallest correct change. Match existing patterns (`CODING_STANDARDS.md`). No drive-by refactors.
2. Restate the goal, list intended files, name regressions, then edit.
3. **>5 files requires explicit user approval** before proceeding.
4. Do not invent product policy, schema, RPCs, routes, env vars, or security behavior. If you would have to guess, ask (`PRINCIPLES.md`).
5. Prefer existing components: `src/components/ui/`, `app/`, `public/`, `landing/`.
6. No new dependencies without explaining why; get approval if an alternative already exists.
7. Only commit when asked. Never commit `.env` or secrets.
8. Do not create extra markdown docs unless asked.
9. Do not claim lint/build/tests passed unless you ran them. If env is missing, say so and give a manual checklist.

Data fetching is ad-hoc `useState`/`useEffect` plus a few hooks. `@tanstack/react-query` is installed but **not wired** — do not add a QueryClient unless asked.

## Layering

- Pages in `src/pages/` route; domain UI in `src/components/{app,public,landing,admin,auth,legal,ui}`.
- Helpers in `src/lib/`. Auth session/roles in `src/contexts/AuthContext.tsx`.
- Flags in `src/config/features.ts`. Typed DB client: `src/integrations/supabase/`.
- Thin `api/*.js` wrappers → shared `server/**` handlers. Keep those in sync with Vite plugins.
- Schema contract: `src/integrations/supabase/types.ts` + `supabase/*.sql`. Confirm live DB before assuming a one-off SQL file was applied. Types lag some live tables (`bootstrap_admin_emails`, `facility_pdf_uploads`, `access_request_rate_limits`).

## Product invariants

- **Work-email gated.** Personal domains blocked unless in `approved_personal_emails` or `bootstrap_admin_emails`. Enforced client-side (`is_email_auth_allowed`) and via `/api/auth-before-user-created`.
- **Roles:** `super_admin` | `facility_admin` | `bd_rep`. `isFacilityAdmin` = facility_admin OR super_admin. UI gates are not security — RLS / SECURITY DEFINER RPCs are.
- **`FEATURES.community === false`.** Feed and Messenger routes redirect to `/app`. Do not enable or bypass without an explicit request.
- **Billing is soft-gated.** Inactive orgs see a dismissible banner; do not hard-lock Search/Facilities unless asked.
- **Search** surfaces approved, non-frozen facilities with in-network contracts. Monthly verification: fresh / recent / stale / frozen (`src/lib/verification.ts`).
- Public share URLs: `/o/:slug`, `/:slug`, `/o/:org/p/:program`, `/p/:slug`. Route order matters — `/:slug` is a catch-all after reserved paths.
- Facility writes go through `saveFacilityWithContracts` → RPC `save_facility_with_contracts`. Prefer that over ad-hoc multi-step writes.

## Critical systems — extra caution

Do not modify these unless the user explicitly asked, and call the risk out first:

- `AuthContext`, `ProtectedRoute`, `AdminRoute`, email-domain gates, auth hook
- RLS policies and RPCs, especially `save_facility_with_contracts`
- Stripe webhook/checkout/portal/billing-overview and `stripe_webhook_events` idempotency
- Public sheets (`src/components/public/*`, `src/pages/public/*`) and OG/`middleware.js`
- `FEATURES` flags
- Service-role usage. **Never** put secrets in `VITE_*`. Vite throws if `VITE_SUPABASE_SERVICE_ROLE` is set. Browser uses anon key + session only.

## Env (purpose only — never commit real values)

Browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (optional `VITE_STRIPE_PUBLISHABLE_KEY`).

Server/scripts: `SUPABASE_SERVICE_ROLE`, `BEFORE_USER_CREATED_HOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAIL`, `EMAIL_FROM`, `SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MEMBERSHIP`, `STRIPE_PRICE_SETUP`, optional `OPENAI_API_KEY`.

## Design

Teal-blue primary (`#2088b8` family), HSL tokens in `src/index.css`. Montserrat display / Inter body. Prefer shadcn primitives. Preserve landing vs app vs public-sheet layout grammar. Dark tokens exist; there is no product theme switcher.

## Verify before claiming done

At least: happy path + one failure/regression path for what you touched. For auth, RLS/RPC, Stripe, public sheets, or facility save, include an explicit checklist. If you cannot run it (missing env), say so.

Do not claim tests passed unless you ran them. Automated tests are sparse; `npm run lint` and `npm run build` are the usual local checks.
