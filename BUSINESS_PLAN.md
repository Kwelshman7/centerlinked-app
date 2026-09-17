# CenterLinked Inc. — Business Plan

**Confidential · September 16, 2026**  
**Supersedes:** September 14, 2026 (which superseded August 22, 2026)  
**Entity:** CenterLinked Inc.  
**Location / governing law:** Florida  
**Product:** https://www.centerlinked.com  
**Status:** Production. BD profiles + insurance-fit Search are the habit. Listing is free. Paid membership is optional and live in Stripe. Billing is soft-gated.

This plan is the current operating document. It is grounded in the live product, Terms of Service §8 (fees as of this date), and the membership catalog in `src/lib/pricing.ts`. Operating numbers (customers, ARR, conversion, burn, headcount) are not invented here.

---

## Table of contents

1. What’s new in this revision  
2. Executive summary  
3. Company overview  
4. The problem  
5. Solution and product  
6. Market  
7. Customers  
8. Competitive landscape  
9. Business model  
10. Go-to-market  
11. Operations and technology  
12. Regulatory, privacy, and brand risk  
13. Traction  
14. 18-month operating plan  
15. Team, financials, and funding  
16. Risks and mitigations  
17. The line we will not cross  
18. Why this can work  
19. Appendix A — Pricing catalog  
20. Appendix B — Shipped product surface  
21. Appendix C — Open items before third-party use  
22. Appendix D — Sources and notes  

---

## 1. What’s new in this revision

This document replaces the September 14, 2026 plan. The company and the commercial on-ramp (free listing, per-facility membership, Search on signup) are the same. The **user we optimize for** is not.

**Direction (September 16)**

- **BD profiles come first.** Without BD reps using the app, organizations will not pay to be listed.
- The weekly job to solve is **insurance fit**: who accepts what insurance.
- Contacts, Connect, and people profiles are **core product**. Feed and Messenger stay gated. “Not a social network” means posts and DMs, not professional contacts.
- Org and program sheets remain necessary as the public leave-behind. They are not the habit that gets a rep to open the app.

**Commercial** (unchanged from September 14)

- **Listing is free.** Claiming and keeping an organization listed does not require a card. Paid membership is optional (Terms §8).
- **Membership is priced per live facility**, not three flat band prices. Published bookends stay $99 (1 facility) → $249 (5) → $499 (15). Each step in between costs more. Annual billing is still two months free. 16+ is quoted from about $799/month.
- **Done For You** is also per-count: $499 (1) through $2,500 (15).
- **Search is free on signup.** A work-email account can skip org claim, land on Search, and claim later from My profile.

**Product shipped since August** (plus Contacts / people profiles in the app)

- Authenticated **Search** is the insurance-fit job. `/app` opens Search. Filters include insurance, plan type, state, city, ZIP, level of care, specialty, and accreditation. Results are an organization list with facility cards for the selection.
- Public program sheets have a **Make a Referral** CTA (call / text / email the BD contact). One-facility orgs skip the org overview and open the program page.
- **PDF import** on `/join` (review-then-save) and a founder **launch-import** path (`/launch/:token`) so a helper can stand up an org from a facilities PDF without inventing contacts or addresses.
- Super-admin **data-quality** dashboard (transparent completeness checks) plus queues for insurance, locations, BD owners, and insurance/accreditation alias review. Directory verification is recorded separately from payer-contract proof.
- Unclaimed public profiles can **request removal**. `/join` is the shareable signup. `/start` is the home-screen login URL.
- Weekly verification-reminder cron, 16+ pricing inquiry, Sentry client monitoring, GitHub Actions CI.

**Unchanged on purpose**

- Not a consumer directory, patient portal, or PHI store.
- Community Feed and Messenger remain **gated off**.
- Search placement is not for sale.
- Billing does not hard-lock Search or Facilities. Inactive memberships see a dismissible banner.

---

## 2. Executive summary

CenterLinked is a **B2B professional tool for behavioral-health BD reps**, with a live organization listing behind it. BD reps must use the app every week. Their job is **who accepts what insurance** — plus level of care, geography, and a real person to call. **BD profiles**, Contacts, and Connect are how the product is theirs. Public org/program sheets remain the branded leave-behind so a listed organization is worth paying for.

The people who **use** the product are BD reps (and other professionals who search). The people who **pay** are organizations, later, because those reps are already looking.

**Why this exists:** BD reps cannot reliably tell who is in-network. Treatment orgs lose referrals when partners work from outdated one-pagers. Insurance networks change, BD contacts rotate, locations open, and levels of care shift. A PDF does not.

**The job to be done:** when a BD rep is ready to place a client, they need four facts fast — level of care, insurance fit, location, and a real person to call — and they need those facts to still be true next month. Getting the rep to open the app is the constraint. Listing revenue follows.

**Commercial model:** listing is free so the catalog can get dense enough that Search is worth opening. Paid membership is optional, priced by **live facilities**, not seats. Referral partners who only view a public profile are not billed. Search placement is not for sale. Team seats are unlimited on paid plans so the whole BD team shares one link.

How it is sold (same shape as the product):

| | Price | Who it’s for |
|--|-------|----------------|
| **Listed** | $0 · no card | Claim, stay listed, Search the same day |
| **1 facility** | $99/mo · $990/yr · DFY $499 | One location, one live link |
| **5 facilities** (bookend) | $249/mo · $2,490/yr · DFY $1,200 | Regional groups — featured “Most orgs” |
| **15 facilities** (bookend) | $499/mo · $4,990/yr · DFY $2,500 | Multi-site source of truth |
| **16+** | Quote from ~$799/mo | Enterprise · request access |

Each count from 2–14 has its own published price between those bookends (full schedule in Appendix A). Annual billing is two months free. Checkout still groups 1 / 2–5 / 6–15 for Stripe; the dollar amount follows the facility count.

**Phase 1 is shipped.** BD profiles, Contacts, Connect, authenticated Search, public org and program sheets, facility and insurance truth, monthly verification, org dashboard, branding, team invites, preferred-partner org network, downloadable one-pagers, Stripe checkout and portal, PDF import, and super-admin curation are live at centerlinked.com. Community Feed and Messenger exist in the codebase and are **gated off**.

**What we are not:** a consumer treatment directory, a patient portal, a PHI store, a lead-gen marketplace, or a social network as the core product.

**Honest status:** product-complete, commercially early. Listing and Search do not require a paid plan. Membership and Done For You are live. The app does not yet block adding facilities above a subscribed count.

---

## 3. Company overview

| | |
|---|---|
| Legal name | CenterLinked Inc. |
| Location | Florida |
| Governing law | Florida (Terms of Service §13) |
| Domain | centerlinked.com |
| Category | Vertical SaaS / professional network infrastructure for behavioral-health BD |
| Phase | Phase 1 shipped; BD-profile + Search habit; free-listed on-ramp live |
| Access model | Work-email gated. Shareable signup at `/join`. Invite and request-access remain. |
| Billing posture | Listing free; paid membership optional; Stripe live; soft-gated (banner, not a lock) |

**Mission:** make it worth a BD rep’s time to open the app — starting with insurance fit — so listed organizations have a reason to pay.

**How the company earns the right to exist:** BD reps already waste time on stale insurance lists. CenterLinked is the place they look that up, plus a profile and Contacts workspace that is *theirs*, plus a persistent org URL that replaces decaying collateral. Free listing exists so Search is not empty. Paid membership and Done For You exist once being listed is clearly valuable.

**How someone uses it, in three steps:**

1. **Join free.** Work-email account at `/join`. No card. Land a BD profile. Search is available immediately; claiming an organization can wait.
2. **Answer insurance fit.** Run Search. Keep Contacts. Connect with other professionals. This is the habit.
3. **List the organization** (or have CenterLinked import a facilities PDF) so the catalog stays useful, then share the public sheet as the leave-behind. Partners reopen it, or they find the org in Search and hit **Make a Referral**.

---

## 4. The problem

Behavioral-health BD is relationship-driven. Placement decisions are not “rehab near me.” They are professional judgments that need four facts fast: **level of care, insurance fit, location, and a real person to call**.

Today those facts live in the wrong artifacts:

| Where the facts live today | Why it fails |
|---|---|
| PDFs, brochures, business cards | Go stale the week a payer drops, a BD rep leaves, or a location opens |
| Org marketing websites | Built for patients and families; named in-network payers are buried or absent |
| Consumer directories (Rehabs.com, Recovery.com, Psychology Today) | Wrong audience; vague on named contracts; optimized for consumer SEO |
| Internal CRM | Pipeline for the selling org — does not show *partners* who you are |

The cost is missed and misrouted referrals. A discharge planner who cannot confirm in-network status, or who calls a disconnected BD cell, sends the client somewhere else.

CenterLinked does **not** guarantee placements. It reduces friction so the right partner can confirm fit and reach the right contact.

---

## 5. Solution and product

One persistent URL per organization, plus per-program sheets. Update the dashboard once; every partner who reopens the link — or who finds the org in Search — sees current information.

### 5.1 The public leave-behind

- **Organization sheet** at `/o/:slug` and `/:slug` — branded profile of the org, approved non-frozen facilities, how to refer. A **one-facility** org skips this overview and opens the program page so the partner is not looking at an empty list.
- **Program / facility sheet** at `/o/:org/p/:program` (legacy `/p/:slug`) — a single location or program. Frozen programs return not found.
- **Make a Referral** — call, text, or email the named BD contact from the program header.
- **Social preview:** OG HTML rewritten for crawlers so a shared link looks like the org, not a generic app card.
- **Downloadable one-pagers:** org overview and facility one-pagers generated from the live sheet — a conference leave-behind that still points at the live URL.
- **Removal:** unclaimed profiles can request removal (public sheet link + `admin@centerlinked.com`). Claiming to correct the profile is free.

Public sheets honor `hidden_from_org_page` and only surface approved, non-frozen facilities.

### 5.2 Trust layer — monthly verification

| Tier | Window | Meaning |
|------|--------|---------|
| Fresh | ≤ 30 days | Verified this month |
| Recent | 31–60 days | Still usable; aging |
| Stale | 61–90 days | Needs confirmation |
| Frozen | > 90 days (or flagged) | Drops out of Search; program sheets return not found |
| Never | No stamp | Not yet verified |

A facility stamp is **not** treated as payer-contract proof. Directory verification events and insurance-row truth are recorded separately. Weekly reminders go out via Vercel Cron (`/api/send-verification-reminders`).

Verification is the product’s honesty mechanism. Catalog growth that outruns verification is a company risk, not a vanity metric — especially now that listing is free.

### 5.3 Authenticated product (what members and free accounts operate)

- Work-email signup at `/join`; `/start` for home-screen login; `/signup` redirects to `/join`
- **BD profile** (My profile when no org; `/app/people/:userId`; `/app/contacts/:contactId`)
- **Contacts + Connect** (`/app/contacts`). App home is Search. `/app/network` redirects to Contacts.
- Organization setup, create, claim, and domain-based join — **or skip and search**, then claim later from My profile
- **Search** is the insurance-fit job (insurance, plan type, geography, ZIP, level of care, specialty, accreditation). Approved + not frozen only. Preferred-partner orgs can be prioritized.
- Search results: organization list; facility cards for the selected org
- Dashboard: org profile, engagement (sheet views / contact clicks), shared links, facilities
- Multi-facility management: photos, reusable BD owners, levels of care, specializations, accreditations, structured insurance contracts (plan types) linked to a curated payer database
- Team members and email invites (unlimited seats on paid plans)
- Monthly contract verification workflow
- PDF facility upload + parse review (Supabase Edge Functions); join-to-import handoff so a PDF picked at signup is reviewed after the org exists
- Org branding: logo, colors, cover/footer images, social links, CTAs
- Stripe billing: per-facility membership, annual option, Done For You, Customer Portal, 16+ inquiry

### 5.4 Super-admin (platform operations)

Ops overview; access requests; personal-email allowlist; organization claims; join requests; facility verifications; payer database; one org workspace per action; **data-quality** completeness; insurance / location / BD-contact queues; insurance and accreditation **alias review** (imported text is not overwritten); launch-import share URL; org create.

### 5.5 Explicitly out of Phase 1

Community **Feed** and **Messenger**. UI and tables exist. `FEATURES.community === false`. Routes redirect to `/app`. Do not turn this on until BD profiles + Search are clearly the habit. Contacts / Connect are already in — they are not this flag.

---

## 6. Market

Industry backdrop (published estimates, **not** CenterLinked data): U.S. mental health and addiction treatment is a large, fragmented market. IBISWorld counts on the order of **5,128 residential mental-health / substance-abuse businesses** (2026). Licensed SUD facilities have been estimated around **17,000**. Those figures describe the industry we sell into, not software TAM, and they mix facilities with organizations.

**Bottoms-up software TAM:** U.S. behavioral-health organizations that take **professional** referrals and would pay to keep a live profile current — or, at minimum, stay listed so partners can find them. A defensible org-count is on the order of **5,000–15,000** (many facilities sit under one org). This is a focused vertical, not a horizontal “all healthcare” TAM.

Free listing means **listed orgs ≠ paying orgs**. ARR scenarios below are **paying** orgs only:

| Mix of 400 paying orgs | Illustrative ARR |
|---|---|
| All 1-facility ($99/mo) | ~$475k |
| 50% at 1 / 35% at 5 ($249) / 15% at 10 ($399) | ~$943k |

These are **scenarios, not forecasts**. They exist to show that a free listed layer can build catalog density while paid ARPU still rises with facility count. They are not a substitute for Stripe MRR.

**What we are not sizing:** consumer “rehab near me” search, patient-pay lead gen, or national directory advertising. Winning that market would require becoming a different company.

---

## 7. Customers

### Who pays

The **organization**, when it chooses membership or Done For You. Checkout is restricted to `facility_admin` or `super_admin`. Typical buyers: org leadership, BD leadership, admissions / marketing.

### Who operates (may be free)

**BD reps first.** Also admissions, marketing, and referral partners with a work email. Free accounts can have a profile and Search without claiming an org. **Seats are unlimited** on paid plans — charging per rep would punish the behavior we want (reps actually using the app).

### Who consumes the link (does not pay)

Hospitals, therapists, case managers, other BD reps, probation officers, discharge planners. They are the reason the link exists. They are never the invoice. They may now also be Search users on a free account.

### ICP

Multi-location treatment orgs with an active BD team — regional groups and multi-site platforms. They already print collateral, already work conferences, and already lose deals to stale insurance lists. They are the Done For You and $249–$499 buyers.

### Anti-ICP

Consumer SEO shops and anyone who wants CenterLinked to “get us patients from Google.” That buyer will churn or demand features that destroy the brand.

### Roles in the product

| Role | Meaning |
|------|---------|
| `super_admin` | Platform operator |
| `facility_admin` | Org admin — profile, facilities, billing, members |
| `bd_rep` | Standard org member (default invite / join) |

UI gates are not security. RLS and SECURITY DEFINER RPCs are.

---

## 8. Competitive landscape

| Alternative | Why CenterLinked is different |
|---|---|
| PDFs / brochures / cards | Go stale; version chaos across every BD inbox |
| Org website | Wrong audience; insurance buried; not built as a leave-behind |
| Rehabs.com, Recovery.com, Psychology Today | Consumer directories; paid listings; not a professional source of truth |
| CRM (Salesforce, etc.) | Internal pipeline — does not show partners who you are |
| Paid “featured listing” directories | CenterLinked does **not** sell Search placement |
| Generic link-in-bio / microsite tools | No payer database, no monthly freeze semantics, no work-email professional network |

**Positioning line:** not a directory for families. A tool BD reps open to see who accepts what insurance — with a live org listing behind it.

There is no serious incumbent whose *only* job is “one verified org link for BD.” That is an advantage and a risk: the category has to be explained, not captured.

---

## 9. Business model

### Who pays

The organization. Never the referral partner. Never a pay-to-rank Search slot.

### Free listed

Claiming and listing is **$0**. No card. The point is catalog density and a professional Search that is not empty. Free accounts can search immediately.

### Membership (optional)

Priced on **how many live facilities the org lists**, per count from 1 to 15 (not metered overage). Published bookends: **$99 / $249 / $499** per month for 1 / 5 / 15 facilities. Annual is monthly × 10 (two months free). Enterprise (16+) is quoted, with a published floor around $799/month.

Included on paid plans: organization dashboard, public shareable profile, unlimited team seats, unlimited profile updates, monthly verification, insurance and level of care listings, referral contact management, authenticated Search.

Today those surfaces are also available without a paid plan (soft-gated early access + free listing). Do not invent a future hard-lock. Name a date before changing that.

### Done For You

Labor-scaled setup on top of membership. $499 is the one-location landing number. A 15-location build is $2,500, not $499. 16+ is quoted. DFY sold below the labor it takes destroys margin on the best accounts. Launch-import (`/launch/:token`) is how a helper can ingest a PDF without inventing addresses or contacts.

### Early access (current commercial reality)

- Inactive subscriptions see a **dismissible banner**. Search and Facilities are **not** hard-locked.
- Terms §8: organizations that have not subscribed may continue to use the Service; notice before a new price is charged.
- Per-count **copy and Checkout amounts** are live. The app does **not** yet block adding facilities above the subscribed count.

### Unit economics (structural, not measured)

Software COGS (Supabase, Vercel, Stripe, Resend) is low relative to paid price. The constraint is **ops cost per org**: access review, payer curation, alias normalization, DFY / launch-import builds, verification follow-up. Free listed orgs that never verify still cost ops — freeze semantics are the control.

**Unknowns to fill from Stripe and admin tools (do not guess):**

- Join → search-only vs claimed-org vs paying conversion
- Mix across facility counts (1 vs 5 vs 15 vs Enterprise)
- DFY attach rate
- Annual vs monthly mix
- Logo retention / churn at month 6 and 12
- Support, DFY, and launch-import hours per org
- Verify-on-time rate for free listed vs paid

---

## 10. Go-to-market

Work-email join. **Not consumer SEO.**

1. **BD profiles + free Search as the habit.** Reps join at `/join`, skip org claim if they want, keep a profile, and run insurance + geography queries the same day. Without this, listing has no buyer.
2. **Free listing as catalog.** Orgs claim or get imported so Search is not empty. Density in 1–2 metros still matters more than a national slogan.
3. **Founder-led BD** into treatment orgs you already know. Conference follow-up is the native use case — the link, the one-pager, and **Make a Referral** are the leave-behind.
4. **Done For You / launch-import** as the wedge for busy CEOs, priced so a 10-location build is not $499.
5. **Convert listed → paid** when being found in Search (and keeping a live sheet) is clearly the org’s professional infrastructure. Do not pretend Search is a paid-only feature while it is free.
6. **Do not** buy “rehab near me.” **Do not** promise to fill beds.

Channels that fit: treatment conferences, existing BD relationships, warm intros, `/join` with optional PDF import, launch-import for assisted setup, and the public sheet itself when a partner asks “who are you in-network with?”

Channels that do not fit: consumer paid search, patient lead marketplaces, open self-serve consumer signup.

---

## 11. Operations and technology

**Stack:** Vite 5 + React 18 SPA, TypeScript, Tailwind + shadcn/ui. Supabase (Auth, Postgres + RLS, Storage, Edge Functions). Stripe Checkout, Customer Portal, webhooks. Resend. Deployed on Vercel (SPA + `api/` serverless + `middleware.js` for OG). Client error reporting via Sentry when configured. GitHub Actions runs lint / test / build.

**Access:** work-email gated. Personal domains blocked unless listed in `approved_personal_emails` or `bootstrap_admin_emails`. Enforced client-side (`is_email_auth_allowed`) and via `/api/auth-before-user-created`.

**Facility writes** go through `saveFacilityWithContracts` → RPC `save_facility_with_contracts`. Prefer that over ad-hoc multi-step writes. Insurance search uses structured contract status, not inferred “in network” copy. Aliases for payers and accreditations are resolved in review queues without overwriting imported text.

**Import path:** `/join` can carry a facilities PDF into org setup; `/launch/:token` is a tokenized helper intake; parse + image extract run on Supabase Edge Functions; review UI requires confirmation before commit.

**Stripe:** Checkout amounts follow live facility count (`price_data` for most SKUs). Profile $99/mo and 1-facility DFY $499 can still use `STRIPE_PRICE_MEMBERSHIP` and `STRIPE_PRICE_SETUP`. 16+ uses the pricing-inquiry flow rather than self-serve Checkout.

**Security posture that is also a sales asset:** no PHI by design, work-email gate, tenant isolation via RLS. The browser never receives `SUPABASE_SERVICE_ROLE` or other secrets.

**Ops scripts** (service-role; `--apply` writes production data): facility-image pipeline, payer backfill/seed, approve-all-facilities, contract reconcile.

---

## 12. Regulatory, privacy, and brand risk

CenterLinked is an **organization profile platform**. It is not a covered entity’s clinical system and must not become one.

| Rule | Why it is existential |
|---|---|
| No patient records / PHI | A single PHI incident would redefine the company as a healthcare app it is not staffed or designed to be |
| No placement guarantee | Terms and FAQ already say this; promising beds is a legal and brand lie |
| Named in-network listings are for fit | Benefits verification stays in admissions |
| Work-email gate | Keeps the network professional and reduces consumer-directory drift |
| No paid Search rank | Selling placement would make the catalog untrustworthy |
| Do not invent addresses or contacts on import | Launch-import and alias review exist so helpers cannot “complete” a profile with fiction |

Wrong-but-confident expansion into patient matching or PHI would destroy the company faster than slow sales.

Terms and Privacy Policy are live. Fees in Terms §8 match the free-listed + per-facility catalog. Governing law and venue are **Florida**. Unclaimed profiles can request removal.

---

## 13. Traction

**Shipped and in production:**

- Marketing landing (problem → how it works → product proof → verification → pricing slider with Free → FAQ)
- Auth (email + Google), work-email gate, `/join`, `/start`, access intake
- Org setup / create / claim / domain join, with skip-to-Search
- Dashboard, facilities, Search (org results + expanded filters), preferred-partner network, members, settings, branding
- Public org and program sheets + OG + Make a Referral + one-facility skip + removal request
- Org and facility one-pagers
- Stripe checkout, portal, webhook idempotency, billing UI, 16+ inquiry
- Monthly verification, weekly reminder cron, admin verification queue
- Super-admin org workspace, claims, access, payers, data quality, completeness queues, alias review
- PDF upload / parse / launch-import path
- Dynamic sitemap; Sentry; GitHub Actions CI

**Fill in from live systems before investor or lender use:**

| Metric | Source | Status in this plan |
|---|---|---|
| Orgs created vs approved vs listed vs paying | Admin + Stripe | Unknown — do not invent |
| Mix by facility count | Stripe + `organizations` | Unknown |
| Facilities live vs frozen | Admin / DB | Unknown |
| Completeness (address, BD, insurance) | Data-quality dashboard | Unknown |
| Public-link reopens, referral clicks, Search queries | `org_analytics_events` / dashboard | Unknown |
| DFY / launch-import attach | Stripe + admin | Unknown |
| Join volume and search-only vs claimed conversion | Auth + `early_access_leads` | Unknown |
| Verify-on-time rate (listed vs paid) | `contracts_verified_at` | Unknown |

Until those are filled, describe the company as **product-complete, commercially early**.

---

## 14. 18-month operating plan (recommended)

### Months 0–6 — BD-rep habit and catalog density

Tight ICP. Get BD reps a profile and into Search the same day they join. Solve insurance fit well enough that they come back. Get orgs listed (self-serve, PDF import, or launch-import / DFY) so answers exist. Do not turn on community. Instrument Search queries, profile/Contacts use, public-link reopens, Make a Referral clicks, one-pager downloads, and listed → paid conversion.

**Success:** a BD rep can answer “who accepts this insurance?” in the first metro; they have a reason to reopen the app; member orgs have a live link they actually send.

### Months 6–12 — Catalog that Search is worth opening

One or two geographies. Hold verify-on-time rate as listing grows. Sell annual in Checkout (already offered). Use DFY to land multi-site groups above $99, not only one-location memberships.

**Success:** a real insurance + ZIP or city query is useful in the focus metros; annual mix is visible in Stripe; completeness scores are going up, not just org count.

### Months 12–18 — Enforce what we sell

Named date to change the free/paid boundary if needed (hard-gate some features, grandfather listed logos, or keep listing free and charge only for DFY / branding / assisted ops). Enforce facility-count caps on create/save if mix shows gaming. Revisit community only if BD profiles + Search are clearly the habit.

**Success metrics** (targets to set from real baselines, not invented here):

- % of listed orgs with a fresh verification
- Public-link reopens and Make a Referral clicks per org per month
- Search queries that return at least one approved, non-frozen facility
- Paid conversion from listed (and DFY attach)
- Logo retention at month 6 and 12
- Mix: share of revenue from 5+ facility orgs vs 1-facility

---

## 15. Team, financials, and funding

**Not in the product repo.** Do not send this plan to a third party with invented headcount, salaries, burn, runway, or a raise amount.

What belongs in a companion one-pager (founder-prepared, not guessed here):

- Legal capitalization and officers
- Current monthly burn and runway
- Stripe MRR / ARR and cash collected
- Count of free listed vs paying orgs
- Whether a raise is contemplated, and for what use of proceeds
- Who operates access review, payer curation, launch-import, and DFY delivery

This document is the **product and commercial plan**. It is not a substitute for financial statements.

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Slow paid adoption | Free Search + listed catalog first; DFY / launch-import wedge; keep $99 one-location on-ramp |
| Free listed never converts | Convert on professional infrastructure (branding, team, verify habit, DFY), not by pretending Search is paid while it is free |
| Catalog rot at free scale | Freeze semantics; completeness dashboard; do not grow faster than verification |
| Billing stays undefined | Named date for the free/paid boundary — keep, grandfather, or hard-gate |
| Facility-count gaming | Enforce caps when early access ends |
| Confused with consumer directories | Keep work-email gate; refuse patient features; removal path for unclaimed profiles |
| PHI creep | Product principles; no clinical workflows |
| DFY / import labor overrun | Never sell $499 for a 12-site build; do not invent addresses or contacts |
| Search empty in new geos | Density before national slogans |
| Community turned on too early | Flag stays off until BD profiles + Search are the habit |
| Live Stripe catalog lag | Mirror published per-count amounts in live Stripe and Vercel env |

---

## 17. The line we will not cross

Even if a feature would be “easy”:

- Consumer treatment directory
- Patient intake, scheduling, medical advice, or clinical decision support
- PHI / patient records
- Open self-serve consumer lead generation
- Social network as the Phase-1 core (Feed / posts / Messenger). Contacts and Connect are in.
- Paid Search placement
- Inventing facility addresses or BD contacts to make an import look complete

If a request would make CenterLinked any of the above, the answer is no.

---

## 18. Why this can work

The job is real: BD teams already spend money on collateral that decays, and referral partners already lose time to stale one-pagers. The product is live and narrow. Trust is designed in (work email, monthly verify, freeze, review-then-save imports).

The September change is the on-ramp and the user: **BD profiles and Search come first**, listing is free so the catalog can exist, **membership is priced by facilities**, and seats stay unlimited so reps actually use the app.

The honest constraint: this is a focused vertical SaaS. It wins when BD reps open it for insurance fit — and listed orgs pay because those reps are already looking — not by winning Google for “rehab.”

---

## Appendix A — Pricing catalog

Source of truth: `src/lib/pricing.ts` and `server/stripe/pricing.mjs`. Must stay in sync with landing, billing UI, Terms §8, Stripe Checkout amounts, and `public/llms.txt`.

**Free listed** — $0, no card. Search for free. Claim/keep-current/appear in Search without a membership.

**Included on paid membership**

Organization dashboard · public shareable profile · unlimited team seats · unlimited profile updates · monthly verification · insurance and level of care listings · referral contact management · authenticated Search.

**Membership and Done For You by live facility count**

| Facilities | Monthly | Annual | Done For You (one-time) |
|------------|---------|--------|-------------------------|
| Free listed | $0 | — | — |
| 1 | $99 | $990 | $499 |
| 2 | $149 | $1,490 | $675 |
| 3 | $189 | $1,890 | $850 |
| 4 | $219 | $2,190 | $1,025 |
| 5 | $249 | $2,490 | $1,200 |
| 6 | $279 | $2,790 | $1,330 |
| 7 | $309 | $3,090 | $1,460 |
| 8 | $339 | $3,390 | $1,590 |
| 9 | $369 | $3,690 | $1,720 |
| 10 | $399 | $3,990 | $1,850 |
| 11 | $429 | $4,290 | $1,980 |
| 12 | $449 | $4,490 | $2,110 |
| 13 | $469 | $4,690 | $2,240 |
| 14 | $489 | $4,890 | $2,370 |
| 15 | $499 | $4,990 | $2,500 |
| 16+ | Quote from ~$799/mo | Quote | Quote |

Checkout groups counts as 1 / 2–5 / 6–15 (internal ids `profile` / `network` / `group`) for Stripe, but the dollar amount is the row above. Network is featured on the landing as “Most orgs.”

Referral partners who only view a public profile are not billed.

---

## Appendix B — Shipped product surface

| Surface | Status |
|---|---|
| Landing + Privacy + Terms | Live |
| `/join` signup + optional PDF import | Live |
| `/start` home-screen login | Live |
| Auth (email, Google, work-email gate) | Live |
| Org setup / claim / join, skip-to-Search | Live |
| BD profiles + Contacts + Connect | In app (`/app/contacts`, `/app/people/:userId`) |
| Org dashboard / My profile | Live |
| Facilities + structured insurance + plan types | Live |
| Monthly verification + weekly reminder cron | Live |
| Authenticated Search (ZIP, specialty, accreditation, plan type) | Live |
| Preferred-partner network | Live |
| Team members / invites | Live |
| Public org + program sheets + OG + Make a Referral | Live |
| One-facility skip to program page | Live |
| Unclaimed profile removal request | Live |
| Org / facility one-pagers | Live |
| Stripe membership + DFY + portal + 16+ inquiry | Live (optional / soft-gated) |
| Super-admin workspace, data quality, completeness queues | Live |
| PDF parse + launch-import | Live (Edge Functions) |
| Community Feed / Messenger | Built, **gated off** |

---

## Appendix C — Open items before third-party use

Do not send this plan to an investor, bank, or large customer until the founder fills:

1. Paying org count and MRR / ARR (Stripe)  
2. Free listed vs paying mix; facility-count mix; DFY attach  
3. Join → Search-only vs claimed-org conversion  
4. Facilities live vs frozen; verify-on-time rate; completeness  
5. Public-link reopens, Make a Referral clicks, and Search query volume  
6. Team, burn, runway  
7. Named date (or grandfather policy) for the free/paid boundary  
8. Confirm live Stripe Checkout amounts match the published per-count table  

---

## Appendix D — Sources and notes

- Product facts: live app at https://www.centerlinked.com, `PROJECT.md`, `PRINCIPLES.md`, `ARCHITECTURE.md`. Agent contract: `AGENTS.md`.
- Pricing: `src/lib/pricing.ts`, Terms of Service §8
- Verification windows: `src/lib/verification.ts`
- Completeness checks: `src/lib/data-quality.ts`
- Industry backdrop: IBISWorld residential MH/SA business count (2026) and published licensed-SUD facility estimates — **industry context only**, not CenterLinked TAM
- This plan does not invent customers, revenue, conversion, burn, or headcount

---

*CenterLinked Inc. · Florida · Confidential · September 16, 2026 · www.centerlinked.com*
