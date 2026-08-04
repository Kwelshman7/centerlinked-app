# AGENTS.md

Project-specific guidance for AI agents. For product/architecture details see `PROJECT.md`, `ARCHITECTURE.md`, `DATABASE.md`, and coding rules in `AI_RULES.md`.

## Cursor Cloud specific instructions

CenterLinked is a single product: a Vite + React (TypeScript) SPA with Vercel serverless functions under `api/` (shared logic in `server/`), backed by a **hosted Supabase** project (Auth + Postgres + RLS/RPCs + Storage + Edge Functions). There is one service to run locally: the Vite dev server. Standard commands live in `package.json` (`dev`, `build`, `build:dev`, `lint`, `preview`); there is no `test` script and no test framework configured.

### Running the app
- `npm run dev` starts Vite on **port 8080** with `strictPort: true` (override with the `PORT` env var). The dev server mounts Vite plugins that mirror the production `/api/*` routes locally: email (`vite-plugin-email-api.ts`), Stripe (`vite-plugin-stripe-api.ts`), auth hook (`vite-plugin-auth-hook.ts`), and social/OG preview (`vite-plugin-social-preview.ts`).
- The frontend, client-side routing, and all marketing/auth/legal pages render **without** any backend credentials, so lint/build/dev and UI work can be verified with no secrets.

### Environment variables (`.env`) — required for backend-dependent flows
- Vite reads env from a **`.env` file** at the repo root via `loadEnv` (it does NOT automatically read process/shell environment variables). If Supabase/Stripe/Resend values are provided as injected environment variables, write them into a local `.env` file (gitignored) before running `npm run dev`. Copy `.env.example` as a starting point.
- Minimum for the app to reach the backend: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE` is needed for the server API routes (Stripe/email/auth-hook) and the ops scripts in `server/*.mjs`.
- Gotcha: if `VITE_SUPABASE_URL` is unset, Vite serializes it to the string `"undefined"`, and `@supabase/supabase-js` throws `Invalid URL` at runtime (blank app). Always provide a valid-format URL. A placeholder like `https://placeholder-project.supabase.co` lets the SPA render (marketing/auth/legal pages) but any real Supabase call fails — use it only for frontend/UI verification.
- Never put secrets in `VITE_`-prefixed vars (they are bundled to the browser). Only `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_STRIPE_PUBLISHABLE_KEY` are public. See `AI_RULES.md`.

### Backend cannot be run locally from this repo
- There is **no local Supabase** setup: no `supabase/config.toml`, no Docker Compose, and no base-schema migration. `supabase/*.sql` and `supabase/migrations/*` are feature-add/hardening scripts that assume the core tables (`organizations`, `facilities`, `insurance_contracts`, etc.) already exist. The canonical schema lives only in the hosted Supabase project (`src/integrations/supabase/types.ts` is the generated type contract).
- Therefore any end-to-end flow that requires auth or the database (sign up / log in, create/claim an org, add a facility, search, billing, public org/program sheets with data) requires a **hosted Supabase project's** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (and a registered test account). Provide these as secrets, then create `.env` from them.

### Lint / build notes
- `npm run lint` (ESLint 9 flat config) passes with warnings only (`react-refresh/only-export-components`, `react-hooks/exhaustive-deps`); no test suite exists.
- `npm run build` (Vite → `dist/`) succeeds; it emits a chunk-size warning for the main bundle, which is expected.
