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
