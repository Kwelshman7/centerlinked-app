# CenterLinked AI Assistant Rules

**Status: MANDATORY.** Every AI assistant working on the CenterLinked production app MUST follow these rules. Violations risk auth breakage, data leaks, billing failures, and public sheet regressions.

Stack context (for orientation only): Vite React SPA, Supabase (Auth + Postgres + RLS/RPCs), Stripe (Checkout/Portal/webhooks), Vercel serverless `api/`, feature flags in `src/config/features.ts`.

---

## General Rules

1. You MUST treat CenterLinked as a production codebase. Prefer the smallest correct change.
2. You MUST read surrounding code, call sites, and related types before editing any file.
3. You MUST explain architectural impact before implementing non-trivial changes.
4. You MUST list every file you intend to change (and every file you actually change).
5. You MUST identify possible regressions before and after coding.
6. You MUST ask for explicit human approval before making changes that affect more than five files.
7. You MUST preserve backward compatibility unless the user explicitly instructs otherwise.
8. You MUST NOT invent product policy, schema, or security behavior that is not already in the codebase or explicitly requested.
9. You MUST NOT expose secrets, service-role keys, Stripe secrets, webhook signing secrets, or private tokens in client code, commits, logs, docs, or chat.
10. You MUST NOT put secrets in `VITE_` environment variables. Only public client values (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) belong there. Server secrets MUST stay in Vercel/server env only.
11. Critical systems require extra caution and explicit permission before modification:
    - `AuthContext` / `ProtectedRoute` / `AdminRoute`
    - Supabase RLS policies and RPCs (especially `save_facility_with_contracts`)
    - Stripe webhooks and billing APIs (`api/stripe-webhook.js`, checkout/portal/billing-overview)
    - Email domain gates (`src/lib/email-domains.ts`, auth hooks)
    - Public sheet routes and views (`components/public/*`, public org/facility sheets)
    - Vercel `middleware.js` and OG (`api/og.js`)
    - `FEATURES` flags (`src/config/features.ts`)

---

## Planning Requirements

Before writing or editing code, you MUST:

1. Restate the user goal in one or two sentences.
2. Identify the smallest set of files required.
3. Read existing implementations in the relevant area (do not redesign from scratch by default).
4. State architectural impact (data flow, auth, RLS, billing, public routes, feature flags).
5. List affected files.
6. Identify possible regressions (auth, saves, billing, public sheets, community gates, mobile UI).
7. If more than five files would change, STOP and ask for approval before proceeding.
8. If the task touches a critical system listed above, call that out explicitly and confirm scope with the user when ambiguous.

---

## Coding Standards

1. You MUST match existing project patterns: TypeScript, React Router, TanStack Query where already used, Zod where already used, Tailwind + shadcn/ui.
2. You MUST prefer existing components under:
   - `src/components/ui/` (shadcn primitives)
   - `src/components/landing/`
   - `src/components/app/`
   - `src/components/public/`
3. You MUST NOT create duplicate components, hooks, utilities, or parallel abstractions when an existing one can be extended or reused.
4. You MUST NOT introduce new dependencies without explaining why they are necessary and getting approval when alternatives already exist in the repo.
5. You MUST keep changes scoped to the task. No drive-by refactors, formatting-only churn, or unrelated cleanup.
6. You MUST preserve the existing design language (tokens, typography, spacing, component APIs, motion patterns).
7. You MUST use existing feature flags (`FEATURES`) rather than inventing new gating mechanisms unless requested.
8. Community features (Feed, Messages, Posts) MUST remain gated by `FEATURES.community`. Do not enable, bypass, or hardcode community routes without an explicit request.
9. Billing UX MUST remain soft-gated (banners/CTAs) unless the user explicitly asks for hard gates that block product usage.
10. Serverless handlers live in `api/`. You MUST keep request validation, auth checks, and secret usage consistent with neighboring handlers.

---

## When Changes Are Allowed

Changes are allowed ONLY when:

1. The user explicitly requested the work (or clearly approved a proposed plan).
2. You have read the surrounding code and understand current behavior.
3. The change set is minimal and task-scoped.
4. You can preserve backward compatibility, OR the user explicitly waived it.
5. For >5 files: the user has approved the broader change set.
6. Schema/auth/RLS/Stripe/middleware changes were specifically requested (not inferred).

---

## When Changes Are Forbidden

You MUST NOT:

1. Rename models, tables, columns, RPCs, or core domain types without explicit permission.
2. Alter authentication flows, session handling, `AuthContext`, `ProtectedRoute`, `AdminRoute`, or auth hooks unless specifically requested.
3. Alter database schemas, migrations, RLS policies, or RPC signatures unless specifically requested.
4. Change APIs, routes, or serverless handlers unrelated to the task.
5. Refactor unrelated files “while you’re here.”
6. Introduce dependencies without explaining why (and without approval when non-obvious).
7. Create duplicate components or parallel UI systems.
8. Disable, weaken, or bypass RLS, email domain gates, or admin checks.
9. Commit, print, or embed secrets; or move server secrets into `VITE_` vars.
10. Hard-block core product flows behind billing unless explicitly asked.
11. Flip `FEATURES.community` (or add ungated community surfaces) unless explicitly asked.
12. Change public sheet URL contracts, OG/middleware behavior, or Stripe webhook idempotency unless specifically requested.
13. Make speculative “improvements” that expand scope beyond the request.

---

## Safe Refactoring Rules

1. Refactor ONLY when required to complete the requested task safely.
2. Prefer extract-within-file or small local helpers over cross-cutting restructures.
3. You MUST NOT rename public symbols, routes, RPC names, or env vars without permission.
4. You MUST keep call sites compiling and behavior equivalent unless a behavior change was requested.
5. If a refactor would touch more than five files, you MUST ask for approval first.
6. You MUST list behavioral risks (especially auth, saves, billing, public sheets) before refactoring critical paths.
7. Do not “clean up” `save_facility_with_contracts` call shapes, Stripe event handling, or auth bootstrap logic as opportunistic refactors.

---

## Database Safety

1. You MUST NOT change Supabase schema, migrations, indexes, constraints, or generated types unless specifically requested.
2. You MUST NOT modify RLS policies or security-definer RPCs without an explicit request and a clear security rationale.
3. Treat `save_facility_with_contracts` as a critical write path. Do not change its arguments, transaction assumptions, or client wrappers casually.
4. Prefer existing RPCs/queries over ad-hoc multi-step writes that can race or bypass invariants.
5. Client code MUST use the anon key + user session only. Never ship the service role key to the browser.
6. You MUST preserve multi-tenant boundaries (`organization_id`, membership, admin/superadmin checks).
7. If schema changes are requested: describe impact on RLS, RPCs, types (`src/integrations/supabase/types.ts`), and rollback risk before editing.

---

## Authentication Safety

1. You MUST NOT alter authentication unless specifically requested.
2. Do not change `AuthContext`, login/signup, Google auth helpers, or session lifecycle without explicit scope.
3. Email domain gates and personal-email blocking MUST remain enforced where already enforced.
4. Do not weaken `api/auth-before-user-created` (or related auth notification hooks) without an explicit request.
5. Auth errors shown to users MUST remain actionable and MUST NOT leak internal secrets or stack traces.
6. Protected app routes MUST continue to go through `ProtectedRoute` / `AdminRoute` as applicable.

---

## Authorization Safety

1. UI hiding is NOT security. Server/RLS/RPC checks MUST remain the source of truth.
2. You MUST NOT bypass org membership, admin, or superadmin checks in client or API code.
3. API routes that mutate billing or privileged data MUST validate the caller consistently with existing handlers.
4. Do not broaden who can approve join/access/claim flows without an explicit request.
5. Public sheet data MUST remain limited to intentionally public fields/views; do not expose private org/member/billing fields on public routes.

---

## UI Consistency

1. You MUST preserve the existing CenterLinked design language.
2. Prefer composing existing `ui` / `app` / `public` / `landing` components over new one-off styling systems.
3. Do not introduce a new visual direction (colors, typography, card patterns, layout grammar) unless requested.
4. Keep landing, authenticated app, and public sheets visually coherent with their current respective patterns.
5. Avoid generic AI-looking redesigns and avoid duplicating components that already exist nearby.
6. Responsive behavior MUST remain intact on desktop and mobile for touched views.

---

## Performance Requirements

1. Do not add unnecessary network waterfalls, N+1 queries, or unbounded list fetches.
2. Reuse existing query patterns (including TanStack Query) rather than inventing parallel fetch layers.
3. Avoid large new client bundles; justify new dependencies.
4. Public sheets and landing paths MUST stay snappy; do not add heavy client-only work to first paint without need.
5. Do not defeat image/OG/middleware caching behavior without an explicit reason.

---

## Accessibility

1. Interactive controls MUST remain keyboard operable.
2. Prefer existing shadcn/Radix primitives (they carry accessibility affordances).
3. Images/icons that convey meaning MUST have appropriate accessible text; decorative images MUST remain decorative.
4. Do not remove focus styles or degrade contrast as part of visual tweaks.
5. Dialogs, sheets, and menus MUST keep focus trapping/labeling consistent with current primitives.

---

## Error Handling

1. Handle failure paths explicitly for network, Supabase, and Stripe calls you touch.
2. User-facing errors MUST be clear; internal details belong in server logs only.
3. Do not swallow errors silently in critical paths (auth, facility save, billing, webhooks).
4. Keep toast/error UX consistent with neighboring screens (`sonner` patterns where used).
5. Webhook and API handlers MUST fail closed on invalid signatures, auth, or payloads.

---

## Logging

1. Log only what is needed to diagnose failures.
2. You MUST NOT log secrets, raw webhook signing material, access tokens, or full payment payloads.
3. Prefer existing logging style in `api/` handlers; do not add noisy console logging to hot UI paths.
4. If adding logs near auth/billing, redact emails/tokens when not required for support workflows.

---

## Testing Expectations

1. You MUST reason about test paths even when automated tests are sparse.
2. For every change, identify what to verify manually (happy path + at least one failure/regression path).
3. Critical-path changes (auth, RLS/RPC, Stripe, public sheets, facility save) MUST include an explicit verification plan.
4. Do not claim “tested” unless you actually ran relevant checks or the user confirmed.
5. If you cannot run something (missing secrets/env), say so and provide a precise manual checklist.

---

## Documentation Requirements

1. Do not create new markdown docs unless the user asks for them.
2. When behavior/API/schema changes are requested, explain impact in the chat response: files touched, compatibility, regressions.
3. Keep comments in code rare and only for non-obvious invariants.
4. Do not update docs to promise behavior you did not implement.

---

## Git Best Practices

1. Only commit when the user explicitly asks.
2. Never skip hooks, force-push protected branches, or rewrite history unless explicitly requested and safe.
3. Never commit `.env`, credentials, service-role keys, or secret-bearing files.
4. Keep commits focused; do not mix unrelated refactors with feature work.
5. Follow the repository’s existing commit message style when committing is requested.

---

## Never Assume Rules

1. NEVER assume a rename is safe.
2. NEVER assume auth can be “simplified.”
3. NEVER assume schema/RLS can be changed to make the UI easier.
4. NEVER assume billing should hard-gate product access.
5. NEVER assume community features should be enabled.
6. NEVER assume public sheets can expose additional fields.
7. NEVER assume a new dependency is acceptable.
8. NEVER assume multi-file refactors are OK without approval (>5 files REQUIRES approval).
9. NEVER assume backward-incompatible API/RPC/route changes are OK.
10. When uncertain, ask. Do not guess on security, money, or data integrity.

---

## Before Coding Checklist

- [ ] User request understood; scope is explicit
- [ ] Surrounding code and call sites read
- [ ] Architectural impact stated
- [ ] Affected files listed
- [ ] Possible regressions identified
- [ ] Approval obtained if more than five files
- [ ] Confirmed whether auth, schema/RLS/RPC, Stripe, middleware/OG, or `FEATURES` are in scope
- [ ] No secrets will be added to client/`VITE_` env
- [ ] Reuse plan for existing `ui` / `app` / `public` / `landing` components
- [ ] Backward compatibility plan confirmed (or explicit waiver)

---

## After Coding Checklist

- [ ] Only task-scoped files changed
- [ ] No unintended auth/RLS/billing/public-sheet edits
- [ ] No new duplicate components or unjustified dependencies
- [ ] Existing design language preserved
- [ ] Feature flags respected (`FEATURES.community` still correct)
- [ ] Soft billing behavior preserved unless hard-gating was requested
- [ ] Errors handled without leaking secrets
- [ ] Affected files and architectural impact reported to the user
- [ ] Possible regressions called out with verification steps

---

## Regression Checklist

Verify as applicable to the change:

- [ ] Login / session restore / protected route access still works
- [ ] Email domain gate still blocks personal/disallowed emails where expected
- [ ] Org admin vs member vs superadmin permissions unchanged
- [ ] Facility create/update via `save_facility_with_contracts` still succeeds
- [ ] Public org/facility sheets still render and share correctly
- [ ] OG/middleware behavior for public links still works
- [ ] Stripe checkout/portal/webhook path still idempotent and signature-safe
- [ ] Billing remains soft-gated (no accidental hard lockout)
- [ ] Community routes remain gated by `FEATURES.community`
- [ ] Landing and app UI still match existing design language on mobile and desktop
- [ ] No secrets or service-role usage introduced on the client
