# CenterLinked — Product Principles

Use this file when choosing what to build, what to refuse, and what not to invent. Product facts live in `PROJECT.md`. Commercial narrative: `BUSINESS_PLAN.md`. This file is the decision filter.

## What we are building

CenterLinked is a **B2B professional tool for behavioral-health and addiction-treatment BD reps**, with a live organization listing behind it.

The people who must **use** the product every week are BD reps. Without them in the app, organizations have no reason to pay to be listed.

The job that brings a BD rep back is **insurance fit**: which facilities accept which insurance, at what level of care, in what geography — and who to call.

**BD profiles** are the starting identity (My profile, `/app/people/:userId`, `/app/contacts/:contactId`). Contacts and Connect are part of that professional network. They are not the gated community Feed / Messenger.

**Organization and program sheets** remain necessary. They are the public leave-behind and the listing an org pays to keep current. They are not the habit that gets a BD rep to open the app.

Legal entity: CenterLinked Inc. Production: https://www.centerlinked.com.

## What we are not

Do not steer the product toward these, even if a change would be “easy”:

- A consumer treatment directory (Rehabs.com, Recovery.com, Psychology Today)
- Patient-facing intake, scheduling, medical advice, or clinical decision support
- Storage or display of PHI / patient records
- Open self-serve consumer lead generation
- A social network as the core — meaning **Feed, posts, and Messenger DMs** (`FEATURES.community` stays off). Contacts, Connect, and BD profiles are the opposite: they are in.

If a request would make CenterLinked any of the above, stop and say so. Do not quietly implement it.

## Best interest of the project

Every change should make it **worth a BD rep’s time**, and keep insurance answers trustworthy enough that orgs will want to be listed.

Prefer work that:

1. Helps a BD rep answer “who accepts this insurance?” quickly and correctly
2. Makes BD profiles and Contacts something reps actually keep current
3. Keeps facility / insurance / contact data accurate (Search is only as good as the contracts)
4. Protects multi-tenant isolation (RLS, RPCs, roles)
5. Preserves public org / program share URLs as a professional leave-behind
6. Keeps monthly verification meaningful (fresh / recent / stale / frozen)
7. Leaves billing, auth, and email working without inventing new policy
8. Stays work-email gated

When two implementations are equally correct, choose the one that:

- A BD rep could use without explanation
- Touches fewer files
- Reuses existing components and RPCs
- Does not expand public data, weaken auth, or add a second product surface

Do not optimize for novelty, extra abstractions, or “complete platform” features that are not in scope.

## Core product, in order

Protect these. Do not bury them under org-admin chrome.

1. **BD profiles** — My profile, people pages, contact pages. The reason a rep has a home in the app.
2. **Insurance-fit Search** — authenticated Search by insurance, plan type, geography, level of care (and related filters). This is the weekly job.
3. **Contacts + Connect** — workspace of people and connection requests. Core. Not community.
4. **Public org and program sheets** — shareable leave-behind; listing orgs still need this.
5. **Facility + insurance-contract truth**, including monthly verification
6. **Org dashboard, members, branding**, shared links
7. **Super-admin curation** (orgs, claims, access, payers, verifications, data quality)
8. **Stripe membership** (optional, soft-gated) and transactional email

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
