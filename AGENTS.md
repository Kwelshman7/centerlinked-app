# CenterLinked — Agent entry

Production B2B referral platform for behavioral-health treatment organizations. Not a patient directory. No PHI.

Read in this order when the task is non-trivial:

1. `PRINCIPLES.md` — what we are building, what we are not, never guess
2. `CLAUDE.md` — stack, commands, invariants, critical systems
3. `CODING_STANDARDS.md` — how code is written in this repo
4. `AI_RULES.md` — mandatory safety / scope checklists
5. Then `PROJECT.md`, `ARCHITECTURE.md`, `DATABASE.md` as needed

Area files: `src/CLAUDE.md`, `server/CLAUDE.md`, `api/CLAUDE.md`, `supabase/CLAUDE.md`.

## Non-negotiable

- **Never guess.** Read the source, types, and SQL. If a table, RPC, route, env var, or product rule is not in the repo, ask. Do not invent it.
- **Best interest of the product:** trustworthy live org/facility/insurance/contact pages for BD teams and referral partners. Do not turn this into consumer lead-gen, a patient portal, or a social network.
- Smallest correct change. Match existing patterns. No drive-by refactors.
- **>5 files requires explicit user approval.**
- Do not alter auth, RLS/RPCs, Stripe, OG/middleware, or `FEATURES` unless the user named that work.
- Client never gets `SUPABASE_SERVICE_ROLE` or other secrets. No secrets in `VITE_*`.
- `FEATURES.community === false`. Billing is soft-gated. Keep both unless asked otherwise.
- Only commit when asked. Do not claim you tested something you did not run.

When uncertain on security, money, privacy, or public URLs: stop and ask. Wrong-but-confident is not acceptable on this codebase.

## Cursor Cloud specific instructions

Dependencies are refreshed automatically by the startup update script (`npm install`). Standard commands live in `CLAUDE.md` (`npm run dev` on port 8080 strictPort, `npm run lint`, `npm test`, `npm run build`).

- **The app needs Supabase env vars to render at all.** `src/integrations/supabase/client.ts` calls `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` at import time; with both undefined it throws and the whole SPA is blank. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (browser-safe public values) before running. `vite.config.ts` uses `loadEnv(mode, cwd, "")`, so these are picked up either from Cursor-injected environment secrets **or** a repo-root `.env` (gitignored) — no `.env` file is required when the secrets are set in the environment.
- **There is no local Supabase stack in this repo.** No `supabase/config.toml`, no Docker, and the full schema is not in-repo (only partial ops SQL + an RLS snapshot under `supabase/`). Backend flows (auth, create org, facilities, search, public sheets) run against the live/remote Supabase project, so they require that project's real anon URL + key. Do not invent schema or spin up a guessed local DB.
- **Public/marketing routes render without a working backend** (landing `/`, `/login`, `/signup`, `/request-access`, `/privacy`, `/terms`) because they don't query Supabase on load — useful for verifying the frontend even with placeholder creds. Any action that hits the backend (login, submitting request-access, creating an org/facility, search) needs valid Supabase credentials.
- Server/API parity in dev comes from the `vite-plugin-*.ts` plugins (email, Stripe, auth hook, OG); these only do real work when their server secrets (`STRIPE_*`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE`, etc.) are set. They are optional for frontend development.
