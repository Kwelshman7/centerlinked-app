# CenterLinked — Agent entry

B2B tool for behavioral-health **BD reps**. Not a patient directory. No PHI.

**Read first (do not load the rest until you need it):**

1. This file — always
2. `PRINCIPLES.md` — what to build, refuse, and not invent
3. `CLAUDE.md` — stack, commands, invariants — **when writing code**
4. `CODING_STANDARDS.md` — **when writing code**
5. `AI_RULES.md` — **non-trivial or critical-system work**
6. `PROJECT.md` / `ARCHITECTURE.md` / `DATABASE.md` — as needed for facts
7. `BUSINESS_PLAN.md` — commercial / positioning only

Area files when you are in that tree: `src/CLAUDE.md`, `server/CLAUDE.md`, `api/CLAUDE.md`, `supabase/CLAUDE.md`.

## Optimize for

BD reps using the app. Their weekly job is **who accepts what insurance**. BD profiles, Contacts, and Connect are how the product is *theirs*. Org/program sheets stay necessary so a listed organization is worth paying for. Without BD reps in the app, orgs will not pay to be listed.

## Non-negotiable

- **Never guess.** Read the source, types, and SQL. If a table, RPC, route, env var, or product rule is not in the repo, ask.
- Smallest correct change. Match existing patterns. No drive-by refactors.
- **>5 files requires explicit user approval.**
- Do not alter auth, RLS/RPCs, Stripe, OG/middleware, or `FEATURES` unless the user named that work.
- Client never gets `SUPABASE_SERVICE_ROLE` or other secrets. No secrets in `VITE_*`.
- `FEATURES.community === false` (Feed / Messenger). Contacts / Connect / people profiles are **core**, not community.
- Billing is soft-gated. Listing is free. Keep both unless asked otherwise.
- Only commit when asked. Do not claim you tested something you did not run.

When uncertain on security, money, privacy, or public URLs: stop and ask.
