# CenterLinked — Project Documentation

**Audience:** Engineers joining the codebase for the first time  
**Scope:** Describes the application as it exists in this repository today  
**Domain:** https://www.centerlinked.com  
**Package version:** `0.1.0` (`package.json`)

---

## What CenterLinked Is

CenterLinked is a **B2B professional tool for behavioral-health BD reps**, with a live organization listing behind it. It is **not** a patient-facing treatment directory (unlike Rehabs.com, Recovery.com, or Psychology Today).

BD reps must use the app every week. Their job is **insurance fit**: who accepts what insurance, at what level of care, in what geography — and who to call. **BD profiles**, Contacts, and Connect are how the product is theirs. Public org/program sheets remain the shareable leave-behind so a listed organization is worth paying for.

Without BD reps in the app, organizations will not pay to be listed.

Legal entity referenced in site metadata: **CenterLinked Inc.**

---

## Business Purpose

BD reps lose time (and placements) when they cannot tell which facilities are in-network. Treatment organizations lose referrals when partners rely on stale one-pagers. Insurance networks change, BD contacts rotate, locations open, and levels of care shift — but shared PDFs do not.

CenterLinked’s purpose:

1. Give a BD rep a profile and a Contacts workspace so they have a reason to be in the app
2. Answer **who accepts this insurance** via authenticated Search (approved, non-frozen facilities with in-network contracts)
3. Keep a live org/program sheet that partners can reopen, maintained through **monthly verification**
4. Let organizations list for free and pay later, once reps are already searching

The platform is work-email gated. It is designed for professional referral relationships, not consumer lead generation, medical advice, or PHI storage.

---

## Target Users

| Audience | Role in the product |
|----------|---------------------|
| **BD reps** | Primary *users* — join with a work email, keep a profile, Search insurance fit, manage Contacts / Connect. Org claim can wait. |
| **Treatment-org admins** | Claim/build the org listing, keep facilities and insurance current, share the public link. They pay if listing is worth it. |
| **Admissions / marketing** | Help maintain program details and contacts |
| **Referral partners** | May also Search; also consume the public link — hospitals, discharge planners, case managers, therapists, other BD reps, probation officers |
| **CenterLinked super admins** | Platform operators — approve access, manage orgs, insurance database, claims, verifications |

---

## Primary Features

### Public / marketing
- Marketing landing page (hero → who it’s for → problem → how it works → product proof → dashboard → monthly verification → pricing → FAQ → CTA)
- Privacy Policy and Terms of Service
- Early-access / request-access intake form (`/request-access`); shareable signup lives at **`/join`** (`/signup` redirects there)
- Public **organization sheets** (`/o/:slug` and `/:slug`) — approved, non-frozen facilities (`hidden_from_org_page` honored)
- Public **program / facility sheets** (`/o/:orgSlug/p/:programSlug`; legacy `/p/:slug` supported) — frozen programs return not found
- Downloadable **one-pager PDFs** from public org/facility sheets (Letter layout + `/api/one-pager-copy` polish)

### Authenticated product
- Work-email signup at `/join`; `/start` for home-screen login. Org claim is optional — skip and Search, claim later from My profile.
- **BD profiles** — My profile (`/app/dashboard` when the user has no org), `/app/people/:userId`, `/app/contacts/:contactId`
- **Contacts + Connect** (`/app/contacts`) — people workspace and connection requests. `/app/network` redirects here. This is core product, not community.
- In-app **Search** by insurance, plan type, state, city, ZIP, level of care, specialty, accreditation (approved + not frozen). This is the insurance-fit job. `/app` index → `/app/search`.
- Organization setup, create, claim, and domain-based join requests
- Organization dashboard (profile, engagement stats, shared links)
- Multi-facility management (create/edit, photos, BD contacts / `bd_representatives`, levels of care, specializations, etc.)
- Insurance contracts per facility (linked to a curated payer database)
- **Referral network** (preferred partner orgs; surfaced in search) — separate from people Connect
- Team members and email invites
- Monthly **contract verification** workflow (fresh / recent / stale / frozen)
- PDF facility upload + parse review flow (via Supabase Edge Functions)
- Stripe billing: free **Listed** tier (`LISTED_TIER`) plus membership priced by **live facility count** (bookends $99 / $249 / $499 for 1 / 5 / 15; annual = 2 months free) and optional Done For You ($499–$2,500). 16+ is quoted.
- Settings and org branding (logo, colors, cover/footer images, social links, CTAs)

### Super-admin tooling
- Manage organizations / create org workspace
- Access requests (early-access leads) + personal-email allowlist
- Organization claims review (approve assigns the claimant as `facility_admin` and emails them)
- Join requests review
- Facility verifications queue
- Insurance (payers) database

### Present but gated
- Community **Feed** and **Messenger** (UI and DB tables exist; `FEATURES.community === false` redirects those routes). Contacts / Connect / people profiles are **not** this flag.

---

## User Roles

### Platform roles (`user_roles.role` / enum `app_role`)

| Role | Meaning |
|------|---------|
| `super_admin` | Full platform admin; AdminRoute gate; can manage all orgs and admin tools |
| `facility_admin` | Organization admin; manages org profile, facilities, billing, members |
| `bd_rep` | Standard org member (default invite / join role) |

`AuthContext` treats `isFacilityAdmin` as **`facility_admin` OR `super_admin`**.

### Organization membership
- `organization_members.role_at_org` (typically `facility_admin` or `bd_rep`)
- Invites via `org_invites`; pending invites claimed on login via `claim_pending_org_invite`
- Domain-matched join requests via `organization_join_requests`

### Bootstrap admins
- Emails listed in Supabase table `bootstrap_admin_emails` can receive `super_admin` via RPC `bootstrap_super_admin` on first authenticated load

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 5, React Router 6 |
| UI | Tailwind CSS 3, shadcn/ui (Radix primitives), Lucide icons, Sonner toasts, Motion (`motion`) |
| Data client | `@supabase/supabase-js` (typed `Database`), direct queries/RPCs from the browser |
| Auth | Supabase Auth — email/password + Google OAuth (PKCE) |
| Database | Supabase Postgres + Row Level Security |
| Storage | Supabase Storage buckets |
| Serverless API | Vercel serverless functions under `api/` (shared logic in `server/`) |
| Local API parity | Vite plugins for email, Stripe, auth hook, social preview |
| Billing | Stripe (Checkout, Customer Portal, webhooks) |
| Email | Resend |
| Analytics | Vercel Analytics |
| Error monitoring | Sentry (`@sentry/react`) when `VITE_SENTRY_DSN` is set; no-op otherwise |
| Optional AI ops | OpenAI (`gpt-4o-mini`) in facility-image batch pipeline; PDF parse via Supabase Edge Functions |
| Geocoding (nearby cities) | Open-Meteo + local US cities JSON |
| Package manager | npm (`package-lock.json`) |

Data fetching is ad-hoc `useState` / `useEffect` plus a few hooks. There is no React Query / `QueryClient`.

---

## Project Goals

1. Get BD reps into the app (profile + Contacts) so organizations have a reason to be listed
2. Solve the weekly BD job: **who accepts what insurance** (authenticated Search)
3. Keep org/program sheets as the professional leave-behind, trustworthy via monthly verification
4. Monetize via optional per-facility membership once Search is a habit; listing stays free
5. Keep community (Feed / Messenger) behind a flag. Contacts / Connect are not that flag.

---

## Design Philosophy

- **Brand-first landing:** CenterLinked logo and teal wordmark are prominent; Montserrat for display headings, Inter for body UI
- **Palette:** Teal-blue primary (`#2088b8` wordmark family), seafoam/teal glows, restrained purple accent — defined as HSL CSS variables in `src/index.css`
- **Atmosphere:** Soft hero/CTA gradients, glow utilities, device mockups (phone/laptop frames), product previews with demo org data (e.g. Banyan)
- **Motion:** CSS keyframes and IntersectionObserver-driven reveals; selective Motion usage (e.g. text morph)
- **Component system:** shadcn “default” + slate base (`components.json`); app shell is a collapsible sidebar layout
- **Public sheets:** Branded org/facility pages meant to be shared externally; OG HTML rewritten for social crawlers
- **Dark theme tokens** exist in CSS; there is no app-wide theme switcher wired for the product shell

---

## Coding Standards Already Followed

| Practice | How it shows up |
|----------|-----------------|
| Path alias | `@/` → `src/` (Vite + tsconfig) |
| Feature flags | `src/config/features.ts` (`FEATURES.community`) |
| Env safety | Build throws if `VITE_SUPABASE_SERVICE_ROLE` is set; secrets use non-`VITE_` names |
| Auth gates | `ProtectedRoute` (session + org setup) and `AdminRoute` (super_admin) |
| Error boundary | `AppErrorBoundary` — limited logging (name/message/stack) |
| UI primitives | Prefer `src/components/ui/*` over one-off controls |
| Layering | Pages route; `components/{landing,app,public,legal,auth}`; domain helpers in `src/lib` |
| Server reuse | Thin `api/*.js` wrappers call shared `server/**` handlers (same code path as Vite plugins in dev) |
| Validation | Zod used sparsely (e.g. claim dialog, some email handlers); most forms are hand-validated |
| TypeScript | Enabled but **not strict** (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`) |
| ESLint | Flat config; recommended JS + typescript-eslint; unused-vars rule off |
| Naming | PascalCase React components; kebab-case SQL files; `.mjs` for Node ops scripts |
| Data access | Prefer Supabase RPC / SECURITY DEFINER for sensitive writes (e.g. `save_facility_with_contracts`) |

---

## Folder Structure Overview

```
app/
├── api/                      # Vercel serverless entrypoints (thin)
├── public/                   # Static assets, robots.txt, sitemap.xml, llms.txt
├── scripts/                  # Generators (e.g. Banyan landing demo JSON)
├── server/
│   ├── auth/                 # Before-user-created hook
│   ├── email/                # Resend send + handlers
│   ├── stripe/               # Checkout, portal, overview, webhook
│   ├── facility-images/      # Offline image fetch / QC / upload pipeline
│   ├── lib/                  # Shared server helpers
│   ├── og-meta.mjs           # Social-preview HTML for bots
│   └── *.mjs                 # One-off ops (approve facilities, payers, reconcile)
├── supabase/
│   ├── migrations/           # Tracked migration(s) + RLS policy snapshot
│   └── *.sql                 # Applied/one-off SQL (billing, RLS, joins, etc.)
├── src/
│   ├── assets/               # Brand + landing imagery
│   ├── components/
│   │   ├── ui/               # shadcn primitives
│   │   ├── landing/          # Marketing sections
│   │   ├── app/              # Authenticated app UI (+ admin, facility, search…)
│   │   ├── public/           # Org/facility sheet presentation
│   │   ├── legal/            # Legal page layout
│   │   └── auth/             # Google button, etc.
│   ├── config/               # Feature flags
│   ├── contexts/             # AuthContext
│   ├── data/                 # Static data (e.g. US cities)
│   ├── hooks/
│   ├── integrations/supabase/# Client + generated Database types
│   ├── lib/                  # Domain helpers (billing, verification, org, etc.)
│   ├── pages/                # Route-level screens (marketing, app, admin, public)
│   ├── App.tsx               # Router
│   ├── main.tsx
│   └── index.css             # Design tokens + global styles
├── vite-plugin-*.ts          # Local API/OG/auth/stripe/email plugins
├── vite.config.ts
├── middleware.js             # Vercel middleware → /api/og for social bots
├── vercel.json               # SPA rewrites, OG includes, weekly verification-reminder cron
├── index.html                # Meta, OG defaults, JSON-LD
├── package.json
└── .env.example              # Documented environment variables
```

---

## High-Level Data Flow

```
┌─────────────┐     Google / email+password      ┌──────────────────┐
│   Browser   │ ───────────────────────────────► │  Supabase Auth   │
│  (Vite SPA) │ ◄──── session (PKCE/localStorage)│                  │
└──────┬──────┘                                  └────────┬─────────┘
       │                                                  │
       │  anon key + RLS / RPCs                           │ before-user-created
       ▼                                                  ▼
┌─────────────┐                                  ┌──────────────────┐
│  Postgres   │ ◄── service role (server only) ──│  Vercel api/*    │
│  + Storage  │                                  │  (Stripe/email/  │
│  + Edge Fns │                                  │   auth hook/OG)  │
└─────────────┘                                  └────────┬─────────┘
       ▲                                                  │
       │ track-org-event / parse-facility-pdf             │ webhooks / Resend
       │                                                  ▼
┌─────────────┐                                  ┌──────────────────┐
│ Edge Funcs  │                                  │ Stripe / Resend  │
└─────────────┘                                  └──────────────────┘
```

### Typical flows

1. **Signup / login** → `/signup` redirects to `/join` → AuthCallback → email allowlist checks → ensure profile → optional bootstrap admin / claim invite → `/setup-organization` (skippable) or `/app` (index → `/app/search`)
2. **Facility save** → client `saveFacilityWithContracts` → RPC `save_facility_with_contracts` (atomic facility + contracts)
3. **Public share** → partner opens `/o/:slug` or program URL → approved facilities + contracts → `track-org-event` Edge Function (page views / contact clicks)
4. **Search** → filters → query contracts joined to approved, non-frozen facilities → group by org → prioritize network partners. Public sheets use the same approved + not-frozen rule (`src/lib/facility-visibility.ts`).
5. **Billing** → org admin starts Checkout via `/api/create-checkout-session` → Stripe webhook updates `organizations` subscription fields → soft banner in app if not active/trialing
6. **Monthly verify** → `/app/facilities/:id/verify` stamps `contracts_verified_at` or edits contracts; frozen facilities excluded from search

---

## Authentication Method

- **Providers:** Email/password and **Google OAuth** (configured in Supabase Dashboard)
- **Client flow:** PKCE; session stored in `localStorage`; callback route `/auth/callback`
- **Work-email gate:** Personal domains (Gmail, Yahoo, Outlook, iCloud, etc.) blocked unless listed in `approved_personal_emails` or `bootstrap_admin_emails`
- **Enforcement layers:**
  1. Client checks via RPC `is_email_auth_allowed` (Login, Signup, AuthContext)
  2. Supabase **Before User Created** HTTPS hook → `/api/auth-before-user-created` (signed with `BEFORE_USER_CREATED_HOOK_SECRET`)
- **Route protection:** Unauthenticated users redirected to `/login`; authenticated users without `organization_id` redirected to `/setup-organization` except org-optional paths (Search, My profile, Contacts, `/app/people/*`, setup/create/onboarding). Admin pages require `super_admin`.

---

## Database Provider

**Supabase (Postgres).**

Key tables include:

- Identity / access: `profiles`, `user_roles`, `organization_members`, `org_invites`, `organization_join_requests`, `approved_personal_emails`, `bootstrap_admin_emails`, `early_access_leads`, `access_request_rate_limits`
- Core domain: `organizations`, `facilities`, `insurance_contracts`, `payers`, `facility_pdf_uploads`, `bd_representatives`, `facility_bd_assignments`
- Professional network: `professional_connections` (Connect). Org favorites: `referral_network`.
- Community (UI gated off): `posts`, `post_likes`, `conversations`, `conversation_participants`, `messages`
- Ops: `organization_claims`, `contract_verifications`, `verification_reminders`, `preferred_provider_changes`, `org_analytics_events`, `stripe_webhook_events`

Enums of note: `app_role`, `verification_status` (`pending|approved|rejected`), `payer_status` (`pending|approved|rejected`).

**Storage buckets in use:** `facility-images`, `org-logos`, `avatars`, `post-images`, `claim-proofs`, `facility-pdfs`.

Schema types live in `src/integrations/supabase/types.ts`. Additional SQL lives under `supabase/*.sql` and `supabase/migrations/`.

---

## Canonical connections

Work only in this folder: `/Users/kylewelshman/Projects/side-projects/centerlinked/app`.

| Service | Canonical target |
|---------|------------------|
| **GitHub** | `https://github.com/Kwelshman7/centerlinked-app` |
| **Vercel** | Project `centerlinked-app` (`prj_s3jPtISaAsvL6lOybD5I9XNECAxt`), domain `https://www.centerlinked.com` |
| **Supabase** | Project **CenterLinked**, ref `ugxdmpctujlaunpdebmd` (`https://ugxdmpctujlaunpdebmd.supabase.co`). Local CLI link is in `supabase/.temp/linked-project.json`. |

Do not edit or deploy from older copies: `centerlinked-lovable` (GitHub `centerlinked-33f7ae01`, different Supabase ref), `Documents/centerlinked`, `Documents/centerlinked 2` (Next.js leftover), or the iCloud `centerlinked` folder. Older GitHub repos `CenterLinked` and `centerlinked-33f7ae01` are not production.

If Cursor’s Supabase plugin says **Recovery1** is paused, that is a leftover plugin project — not this app. Reconnect the plugin to **CenterLinked** (`ugxdmpctujlaunpdebmd`).

---

## Deployment Platform

**Vercel** (project name `centerlinked-app`).

- Frontend: Vite production build served as SPA
- `vercel.json` rewrites non-`api` routes to `index.html`
- Serverless functions in `api/`
- `middleware.js` rewrites social-preview bot traffic on public share paths to `/api/og`
- Weekly verification-reminder cron: `vercel.json` → `GET/POST /api/send-verification-reminders` (`0 14 * * 2`, Bearer `CRON_SECRET`)
- Production site URL documented as `https://www.centerlinked.com`
- Local dev: `vite` on port **8080** with plugins mirroring production API routes

---

## Third-Party Services

| Service | Purpose |
|---------|---------|
| **Supabase** | Auth, Postgres, RLS, Storage, Edge Functions (`track-org-event`, `parse-facility-pdf`, `extract-pdf-images`), Auth Hooks |
| **Stripe** | Membership subscription, Done For You one-time setup, Customer Portal, webhooks |
| **Resend** | Transactional email (access requests, auth events, welcome, DFY admin notify) |
| **Google OAuth** | Sign-in provider via Supabase |
| **Vercel Analytics** | Product analytics in `App.tsx` |
| **Sentry** | Client error reporting when `VITE_SENTRY_DSN` is set (`src/lib/monitoring.ts`); unset is a no-op |
| **OpenAI** | Optional vision QC in `server/facility-images` batch pipeline |
| **Open-Meteo** | Geocoding for nearby-cities display on program sheets |
| **Google Fonts** | Inter + Montserrat |

Default OG / Twitter image in `index.html` is `https://www.centerlinked.com/og-image.png`. Public share unfurls still go through middleware + `/api/og`.

---

## Environment Variables

Documented in `.env.example`. **Never commit real secrets.** Purposes only:

### Browser-exposed (`VITE_`)
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL for the client |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (RLS-enforced) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional; not required for hosted Checkout redirect |
| `VITE_SENTRY_DSN` | Optional; public write-only Sentry ingest DSN. Unset = monitoring is a no-op |

### Server / scripts only (must NOT use `VITE_` prefix)
| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE` | Privileged Supabase access for webhooks, checkout writes, ops scripts, auth hook |
| `BEFORE_USER_CREATED_HOOK_SECRET` | Verifies Supabase before-user-created webhook signatures |
| `RESEND_API_KEY` | Sends transactional email via Resend |
| `ADMIN_NOTIFY_EMAIL` | Inbox for admin notifications (default documented as admin@centerlinked.com) |
| `EMAIL_FROM` | From header for outbound email |
| `SITE_URL` | Canonical site origin for links/emails (prod: https://www.centerlinked.com) |
| `STRIPE_SECRET_KEY` | Stripe API secret (restricted key preferred) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_PRICE_MEMBERSHIP` | Price ID for Profile $99/mo membership (other tiers use Checkout `price_data`) |
| `STRIPE_PRICE_SETUP` | Price ID for 1-facility Done For You $499 (larger DFY packages use Checkout `price_data`) |
| `OPENAI_API_KEY` | Optional; facility-image quality checks |
| `CRON_SECRET` | Bearer secret required by `/api/send-verification-reminders` (Vercel Cron) |

### Configured outside this file
- Google OAuth client ID/secret in Supabase + Google Cloud Console
- Super-admin bootstrap emails in Supabase (`bootstrap_admin_emails`), not in `VITE_` vars

---

## Current Implementation Status

### Production-capable (routed and integrated)
- Landing + legal pages
- Auth (email, Google, callback, work-email gates, auth hook)
- Access request intake + admin review
- Org setup / create / join / claim flows
- Authenticated shell: Search, Contacts / Connect / people profiles, dashboard (My profile when no org), facilities, members, settings, billing. `/app` → Contacts if org, else Search.
- Public org and program sheets with analytics events and one-pager PDF export
- Stripe checkout, portal, webhook idempotency, billing UI
- GitHub Actions CI (`lint` / `test` / `build` on PR and push to main)
- Monthly verification UI and admin verifications page
- Super-admin organization and insurance tools
- PDF upload path (depends on deployed Supabase Edge Functions)
- Facility image offline pipeline and payer/contract maintenance scripts

### Soft / partial
- **Billing soft-gate:** Non-active subscriptions show a dismissible banner; the app remains usable (early-access posture). Free **Listed** tier is available without a card.
- **Org claim approve:** Approving a claim assigns the claimant as `facility_admin` and emails them (`OrganizationClaims.tsx`). If they have not created an account yet, they are attached on first sign-in.
- **`email_signup_eligible` RPC:** Present in SQL/types; live auth path uses `is_email_auth_allowed` instead
- **Terms §8 vs Pricing:** Fees in Terms now match the facility-banded catalog; early-access copy still allows use without an active membership

### Explicitly gated off
- **Community Feed + Messenger** (`FEATURES.community = false`) — code and tables remain; routes redirect to `/app`

### Ops tooling (npm scripts)
- `facility-images` / `:status` / `:apply`
- `backfill-payer-ids`, `seed-missing-payers`
- `approve-all-facilities`
- `reconcile-contracts` / `:apply`

---

## Known Limitations (as discovered)

1. **Community Feed / Messenger are disabled.** Contacts / Connect / BD profiles are a separate, in-product surface. Older copy (`public/llms.txt`) may still describe a census-post narrative.
2. **Subscription status does not hard-lock product features** — only UI banners/CTAs.
3. **TypeScript strictness is loose**, so many null/any issues will not fail the build.
4. **Social OG for public sheets** depends on middleware + `/api/og` + crawler detection; normal browsers still receive the SPA shell. Default `index.html` OG image is `/og-image.png` on the production domain.
5. **PDF parse / image extract Edge Functions** are invoked from the app but their source is not in this repo’s `api/` folder.
6. **Catch-all public slug route** (`/:slug`) requires reserved-slug discipline so marketing/app paths are not shadowed.
7. **Dark mode CSS tokens** exist without a full product theme toggle. Toasts are pinned to `theme="light"`.
8. **SQL change management** is still a manual Supabase SQL Editor checklist (`supabase/migrations/20260802120000_production_security_bundle.sql`). Inspect with `supabase/inspect-live-security.sql` before assuming production matches the repo. GitHub Actions does not apply SQL.
9. **Facility image pipeline** is offline/batch (Sharp + optional OpenAI), not part of the request path.

---

## Future Scalability Considerations

These are architectural facts that will matter as usage grows — not a roadmap.

- **SPA + RLS model:** Nearly all authenticated reads/writes go from the browser through the anon key; correctness and multi-tenant isolation depend on RLS policies and SECURITY DEFINER RPCs remaining airtight.
- **Vercel serverless functions** handle Stripe webhooks, email, auth hooks, and OG HTML — subject to cold starts, payload/body constraints (webhooks need raw body), and platform timeouts.
- **Stripe webhook idempotency** is already modeled via `stripe_webhook_events`; billing state on `organizations` is the source of truth for the app UI.
- **Search** currently loads up to a large contract result set client-side (grouped in the browser); query volume and payer alias matching will pressure indexes and payload size as the catalog grows.
- **Public sheet traffic + analytics** write events through an Edge Function; engagement stats are aggregated via RPC for dashboards.
- **OG generation** adds DB/HTML work per social crawler hit (response caching ~300s on the OG handler).
- **Invite-only / work-email / allowlist** constraints mean growth is gated by access approval operations, not open self-serve viral signup alone.
- **Community tables already exist**; flipping `FEATURES.community` enables Feed/Messages UI without a separate feature codebase — but also activates a second product surface (posts, DMs) under the same RLS model.
- **Media durability** relies on Supabase Storage (Vercel filesystem is ephemeral); batch image jobs write reports locally for ops, not as deploy artifacts.
- **Loose TypeScript + ad hoc fetching** increase the cost of large refactors and concurrent feature work as the surface area expands.

---

## Key Routes (quick map)

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/login`, `/signup`, `/join`, `/start`, `/auth/callback` | Authentication (`/signup` redirects to `/join`; `/start` is home-screen login) |
| `/request-access` | Early access form |
| `/privacy`, `/terms` | Legal |
| `/setup-organization`, `/create-organization` | Org onboarding (skippable → Search) |
| `/o/:slug`, `/:slug` | Public org sheet |
| `/o/:org/p/:program`, `/p/:slug` | Public facility/program sheet |
| `/app/*` | Authenticated application (`/app` → `/app/search`) |
| `/app/contacts`, `/app/contacts/:contactId`, `/app/people/:userId` | Contacts workspace + BD / people profiles |
| `/app/admin/*`, `/app/verifications` | Super-admin tools |
| `/api/*` | Serverless APIs (Stripe, email, auth hook, OG) |

---

## Getting Oriented as a New Engineer

1. Read `.env.example` and set local env (never commit secrets).
2. Run `npm install` and `npm run dev` (Vite on port 8080). `npm test` covers checkout rules, visibility, payer matching, and the insurance plan-types catalog.
3. Confirm Supabase URL/anon key, and that the security-bundle SQL files have been applied to your project (see `DATABASE.md` repository SQL map). Deploy SPA/API only after those RPCs exist, or stamp/invite calls 404.
4. Trace a happy path: join → skip org → Search an insurance query → open My profile → (optional) claim org → Contacts → public `/o/:slug` → verify contracts → billing.
5. For server behavior, start from thin `api/*.js` files and follow into `server/**`.
6. Treat `src/integrations/supabase/types.ts` + `supabase/*.sql` as the schema contract; verify live DB before assuming a one-off SQL file has been applied.

---

*This document reflects the repository as inspected. It does not prescribe changes.*
