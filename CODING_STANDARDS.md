# CenterLinked — Coding Standards

Match the code that is already in this repository. Do not introduce a second style. Broader safety rules: `AI_RULES.md`. Product filter: `PRINCIPLES.md`.

## Language and tooling

- TypeScript + React function components. Pages are **default exports**; reusable modules use named exports.
- Path alias `@/` → `src/`. Do not use deep relative imports across `src/` when `@/` works.
- Package manager is **npm**. Do not add yarn/pnpm lockfiles.
- TypeScript is **not strict** (`strictNullChecks` / `noImplicitAny` off). Still type new public functions, props, and API payloads. Do not spread `any` to “make it compile.”
- ESLint: unused-vars is off. Do not enable noisy new lint rules as a drive-by.
- `@tanstack/react-query` is installed and **unused**. Do not add `QueryClientProvider` / `useQuery` unless asked.
- Zod is used sparsely. Do not wrap the whole app in schemas; follow the nearest file.

## File naming

| Kind | Pattern | Example |
|------|---------|---------|
| React components / pages | PascalCase `.tsx` | `OrgDashboard.tsx` |
| Hooks | `useX.ts` | `useReferralNetwork.ts` |
| Lib helpers | kebab-case `.ts` | `save-facility.ts` |
| Vercel API | kebab-case `.js` | `create-checkout-session.js` |
| Shared server handlers | `.mjs` | `server/stripe/handlers/webhook.mjs` |
| SQL | kebab-case `.sql` | `save-facility-with-contracts.sql` |

Colocate by domain: `src/pages/` routes, `src/components/{ui,app,public,landing,auth,legal}/`, `src/lib/`, `src/hooks/`, `src/contexts/`.

## React / UI

- Prefer existing shadcn primitives in `src/components/ui/` (`Button`, `Card`, `Dialog`, `Sheet`, `Select`, `Tabs`, `Command`). Compose; do not fork.
- Classes: Tailwind utilities + `cn()` from `src/lib/utils.ts`. Do not add CSS modules or styled-components.
- Icons: `lucide-react`. Toasts: `sonner` (`toast.*`), already mounted in `App.tsx`.
- Loading: `Loader2` + `animate-spin` on a centered grid, as in `ProtectedRoute`.
- Auth: `useAuth()` from `AuthContext`. Do not read session ad-hoc in new screens if context already has it.
- Data: local `useState` / `useEffect` / small hooks (`useReferralNetwork`, `useOrgTeamMembers`). Keep fetch logic next to the screen unless a second caller exists.
- Forms: follow the nearest dialog (facility, settings, admin). Do not add a form library.
- Routing: React Router 6. Protected app under `/app`. Do not reorder `/:slug` ahead of reserved paths.
- Feature flags: `FEATURES` in `src/config/features.ts` only. Community routes stay gated.

### Design language

Tokens live in `src/index.css` (HSL CSS variables). Primary is the teal-blue wordmark family (`#2088b8`). Display headings: `font-heading` (Montserrat). Body: Inter.

- Landing, authenticated app, and public sheets each have their own layout grammar — do not mix them.
- Use `buttonVariants` (`default`, `outline`, `hero`, …) instead of one-off CTA classes.
- Do not introduce a theme switcher. Dark tokens exist; the product shell is light.
- Keep focus rings, labels, and Radix dialog/sheet behavior intact.

## Data access (browser)

- Import `supabase` from `@/integrations/supabase/client`. It is typed with `Database`.
- Client uses the **anon key + user session**. Never import or bundle `SUPABASE_SERVICE_ROLE`.
- Prefer an existing RPC for multi-table writes. Facility create/update: `saveFacilityWithContracts` in `src/lib/save-facility.ts` → `save_facility_with_contracts`.
- Org branding: `update_organization_profile`. Do not UPDATE billing columns from the client (trigger rejects them; webhook/service role owns them).
- Select only columns the UI needs. Public sheets must not add private member/billing fields.
- Handle `{ data, error }` explicitly. User-facing failures go through `toast` or in-page copy; do not dump PostgREST internals.

## Server / API

- Business logic lives in `server/**`. `api/*.js` files are thin method/CORS/body wrappers that return `result.status` + `result.json`.
- Vite plugins must keep calling the same handlers so local `npm run dev` matches production.
- Privileged routes: Bearer JWT + existing checks (`assertOrgBillingAdmin` for billing). Fail closed.
- Stripe webhook: **raw body**, signature verify, idempotency via `stripe_webhook_events`. Do not enable `bodyParser` on that route.
- Errors: log server-side with a route tag (`[api/create-checkout-session]`); respond `{ error: string }` without secrets or stack traces.
- Email is non-blocking for auth UX. Do not turn Resend failures into a login hard-stop.

## SQL / schema

- Do not add or alter tables, RPCs, or RLS unless the user asked.
- New SQL, if requested, is kebab-case under `supabase/` and must describe apply/rollback risk.
- After schema changes, update `src/integrations/supabase/types.ts` in the same task.
- Types lag some live tables. If a table is used in app/SQL but missing from types, do not “fix” it by inventing a type shape — read the SQL and say so.

## Comments, errors, commits

- Comments only for non-obvious invariants (why, not what).
- Do not log tokens, webhook signing material, service-role keys, or full payment payloads.
- Commit only when asked. No `.env`, credentials, or secret-bearing files.

## Do not add (unless explicitly requested)

- Next.js, Server Actions, Redux, React Query wiring, new CSS frameworks
- Hard billing gates on Search/Facilities
- Ungated Feed/Messenger
- New public URL schemes that break `/o/:slug` or `/o/:org/p/:program`
- Duplicate components that already exist in `ui/`, `app/`, `public/`, or `landing/`
