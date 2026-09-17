# src/ — SPA

React 18 client. Routes in `src/App.tsx`. Alias `@/` → `src/`.

Read `PRINCIPLES.md` (BD-rep first) and `CODING_STANDARDS.md` before changing UI. Do not guess missing types, routes, or product copy — open the file.

## Optimize for

BD reps using the app. Insurance-fit **Search** is the weekly job. **BD profiles**, Contacts, and Connect are how the product is theirs. Org/program sheets stay the public listing.

## Layout

| Path | Role |
|------|------|
| `pages/` | Route screens (default export) |
| `components/ui/` | shadcn/Radix primitives — reuse these |
| `components/app/` | Authenticated product (contacts, search, facility, admin, network) |
| `components/public/` | Shareable org/program sheets — external brand surface |
| `components/landing/` | Marketing site |
| `lib/` | Domain helpers (save-facility, billing, verification, professional-network, public-urls) |
| `hooks/` | Small data hooks (`useProfessionalNetwork`, `useReferralNetwork`, …) |
| `contexts/AuthContext.tsx` | Session, profile, roles |
| `config/features.ts` | `FEATURES.community` (Feed / Messenger only) |
| `integrations/supabase/` | Typed client + `types.ts` |

## Rules for this tree

- New screens go through `ProtectedRoute` / `AdminRoute` the same way neighbors do.
- Fetch with `useState`/`useEffect` or an existing hook. Do not introduce React Query.
- Facility writes: `saveFacilityWithContracts`. Insurance Search depends on that RPC staying correct.
- Public pages (`pages/public/*`, `components/public/*`) expose only intentionally public fields. Use `org-public-select.ts` fallbacks when optional columns may be missing.
- Public URL helpers: `src/lib/public-urls.ts`. Do not invent new slug paths.
- People / Contacts helpers: `src/lib/professional-network.ts`, `src/lib/contact-workspace.ts`. Prefer these over a new graph.
- Person profile fields: `components/app/BdProfileForm.tsx` (My profile + Settings). Do not fork a second profile form.
- Toasts: `sonner`. Buttons/inputs: `components/ui`. Icons: `lucide-react`.
- Keep `FEATURES.community` gating for Feed/Messages only. Do not add nav links to Feed/Messages while the flag is false. Do not hide Contacts behind that flag.
- Billing UI stays a banner + `/app/billing`, not a hard lock, unless asked.
- `/app` home: Search for everyone. Contacts stays in nav.

## Critical files (read, don’t casually rewrite)

`App.tsx`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`, `lib/save-facility.ts`, `lib/email-domains.ts`, `lib/billing.ts`, `lib/professional-network.ts`, `config/features.ts`, `integrations/supabase/client.ts`.
