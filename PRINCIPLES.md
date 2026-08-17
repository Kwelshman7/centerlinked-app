# CenterLinked — Product Principles

Use this file when choosing what to build, what to refuse, and what not to invent. Product facts live in `PROJECT.md`. This file is the decision filter.

## What we are building

CenterLinked is a **B2B professional referral platform** for behavioral-health and addiction-treatment organizations.

Treatment orgs lose referrals when partners rely on stale PDFs, brochures, and business cards. Insurance networks change, BD contacts rotate, locations open, levels of care shift. CenterLinked replaces that with **one live, shareable organization link** that stays current through monthly verification.

The people who maintain the product are BD / admissions / marketing teams. The people who reopen the link are referral partners: hospitals, discharge planners, case managers, therapists, other BD reps, probation officers.

Legal entity: CenterLinked Inc. Production: https://www.centerlinked.com.

## What we are not

Do not steer the product toward these, even if a change would be “easy”:

- A consumer treatment directory (Rehabs.com, Recovery.com, Psychology Today)
- Patient-facing intake, scheduling, medical advice, or clinical decision support
- Storage or display of PHI / patient records
- Open self-serve consumer lead generation
- A social network as the Phase-1 core (Feed / Messenger exist but are gated off)

If a request would make CenterLinked any of the above, stop and say so. Do not quietly implement it.

## Best interest of the project

Every change should make referral handoffs **more trustworthy, easier to reopen, and safer to operate**. Prefer work that:

1. Keeps org/facility/insurance/contact data accurate and easy for partners to find
2. Protects multi-tenant isolation (RLS, RPCs, roles)
3. Preserves the public share URL as a professional, branded source of truth
4. Keeps monthly verification meaningful (fresh / recent / stale / frozen)
5. Leaves billing, auth, and email working without inventing new policy
6. Stays invite-oriented and work-email gated

When two implementations are equally correct, choose the one that:

- Touches fewer files
- Reuses existing components and RPCs
- Does not expand public data, weaken auth, or add product surface
- A BD rep or referral partner could understand without explanation

Do not optimize for novelty, extra abstractions, or “complete platform” features that are not in scope.

## Core product, in order

Phase 1 priority (already shipped; protect these):

1. Public org sheet and program/facility sheet
2. Authenticated Search (insurance, geography, level of care)
3. Facility + insurance-contract truth, including monthly verification
4. Org dashboard, members, branding, shared links
5. Super-admin curation (orgs, claims, access, payers, verifications)
6. Stripe membership (soft-gated) and transactional email

Do not enable community (`FEATURES.community`) or hard-lock the app behind billing unless the user explicitly asks.

## Never guess

You do not know the live database, applied SQL, env values, or product policy unless you have read them in this repo or the user has stated them.

**Do not invent:**

- Tables, columns, enums, RPCs, RLS policies, or Storage buckets
- Routes, env vars, Stripe price IDs, or API contracts
- Product rules (who can join, what is public, what billing blocks)
- That a `supabase/*.sql` file has been applied to production
- That you ran tests, lint, or a happy path you did not run
- PHI features, patient workflows, or consumer-directory behavior
- New dependencies, feature flags, or parallel UI systems

**Do this instead:**

1. Read the relevant source, types, and SQL before editing
2. Treat `src/integrations/supabase/types.ts` as the typed contract, and `DATABASE.md` as the map — both can lag the live project
3. If a column/RPC/policy is missing from types or SQL, say it is unverified
4. If the user request is ambiguous on auth, money, privacy, or public URLs, ask
5. If you cannot verify something, say what you do not know and what you would check

Wrong-but-confident code is worse than a clarifying question. Guessing on schema, RLS, Stripe, or public sheets can leak tenant data or break referral links in production.

## When to ask

Ask before proceeding when:

- More than five files would change
- Auth, RLS, RPCs, Stripe, OG/middleware, or `FEATURES` are in scope and the user did not name them
- You would need to invent a column, RPC, or product rule to finish
- Backward compatibility would break
- The request conflicts with “what we are not”

Ask a specific question. Do not pad the change with speculative extras while you wait.

## Professional bar

Ship code a senior engineer would accept on a production healthcare-adjacent B2B app:

- Minimal, task-scoped, behavior-preserving unless a behavior change was requested
- Names and UX that fit BD / referral language already in the product
- Fail closed on auth, signatures, and tenant checks
- User-facing errors that are actionable and do not leak internals
- No secrets in client bundles, logs, commits, or `VITE_*` server values
