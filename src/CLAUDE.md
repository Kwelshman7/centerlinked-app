# src/ — SPA

React 18 client. Routes in `src/App.tsx`. Alias `@/` → `src/`.

Read `CODING_STANDARDS.md` and `PRINCIPLES.md` before changing UI. Do not guess missing types, routes, or product copy — open the file.

## Layout

| Path | Role |
|------|------|
| `pages/` | Route screens (default export) |
| `components/ui/` | shadcn/Radix primitives — reuse these |
| `components/app/` | Authenticated product (facility, search, admin, network, feed) |
| `components/public/` | Shareable org/program sheets — external brand surface |
| `components/landing/` | Marketing site |
| `lib/` | Domain helpers (save-facility, billing, verification, public-urls) |
| `hooks/` | Small data hooks |
| `contexts/AuthContext.tsx` | Session, profile, roles |
| `config/features.ts` | `FEATURES.community` |
| `integrations/supabase/` | Typed client + `types.ts` |

## Rules for this tree

- New screens go through `ProtectedRoute` / `AdminRoute` the same way neighbors do.
- Fetch with `useState`/`useEffect` or an existing hook. Do not introduce React Query.
- Facility writes: `saveFacilityWithContracts`. Insurance search depends on that RPC staying correct.
- Public pages (`pages/public/*`, `components/public/*`) expose only intentionally public fields. Use `org-public-select.ts` fallbacks when optional columns may be missing.
- Public URL helpers: `src/lib/public-urls.ts`. Do not invent new slug paths.
- Toasts: `sonner`. Buttons/inputs: `components/ui`. Icons: `lucide-react`.
- Keep `FEATURES.community` gating. Do not add nav links to Feed/Messages while the flag is false.
- Billing UI stays a banner + `/app/billing`, not a hard lock, unless asked.

## Critical files (read, don’t casually rewrite)

`App.tsx`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`, `lib/save-facility.ts`, `lib/email-domains.ts`, `lib/billing.ts`, `config/features.ts`, `integrations/supabase/client.ts`.
