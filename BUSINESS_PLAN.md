# CenterLinked Inc. — Business Plan

**Confidential · August 22, 2026**  
**Entity:** CenterLinked Inc.  
**Location / governing law:** Florida  
**Product:** https://www.centerlinked.com  
**Status:** Production, early-access posture (membership live; billing is soft-gated)

This plan is the current operating document. It is grounded in the live product, Terms of Service (effective August 22, 2026), and the membership catalog in `src/lib/pricing.ts`. Operating numbers (customers, ARR, conversion, burn, headcount) are not invented here.

---

## Table of contents

1. Executive summary  
2. Company overview  
3. The problem  
4. Solution and product  
5. Market  
6. Customers  
7. Competitive landscape  
8. Business model  
9. Go-to-market  
10. Operations and technology  
11. Regulatory, privacy, and brand risk  
12. Traction  
13. 18-month operating plan  
14. Team, financials, and funding  
15. Risks and mitigations  
16. The line we will not cross  
17. Why this can work  
18. Appendix A — Pricing catalog  
19. Appendix B — Shipped product surface  
20. Appendix C — Open items before third-party use  
21. Appendix D — Sources and notes  

---

## 1. Executive summary

CenterLinked is a **B2B professional referral platform** for behavioral-health and addiction-treatment organizations. It replaces stale PDFs, brochures, and business cards with **one live, branded organization link** that referral partners can reopen: who the org is, where facilities are, what they treat, which insurance they are in-network with, and who to contact.

The people who **maintain** the product are BD, admissions, and marketing teams. The people who **reopen the link** are hospitals, discharge planners, case managers, therapists, other BD reps, and probation officers.

**Why this exists:** treatment orgs lose referrals when partners work from outdated one-pagers. Insurance networks change, BD contacts rotate, locations open, and levels of care shift. A PDF does not.

**The job to be done:** when a professional is ready to place a client, they need four facts fast — level of care, insurance fit, location, and a real person to call — and they need those facts to still be true next month.

**Commercial model:** membership is priced by **live facilities**, not seats. Referral partners who only view a public profile are not billed. Search placement is not for sale. Team seats are unlimited on every paid plan so the whole BD team shares one link.

| Plan | Live facilities | Monthly | Annual (2 months free) | Done For You (one-time) |
|------|-----------------|---------|------------------------|-------------------------|
| Profile | 1 | $99 | $990 | $499 |
| Network | 2–5 | $249 | $2,490 | $1,200 |
| Group | 6–15 | $499 | $4,990 | $2,500 |
| Enterprise | 16+ | Custom (floor ~$799/mo) | Custom | Quote |

**Phase 1 is shipped.** Public org and program sheets, authenticated Search, facility and insurance truth, monthly verification, org dashboard, branding, team invites, referral network, downloadable org/facility one-pagers, Stripe checkout and portal, and super-admin curation are live at centerlinked.com. Community Feed and Messenger exist in the codebase and are **gated off**.

**What we are not:** a consumer treatment directory, a patient portal, a PHI store, a lead-gen marketplace, or a social network as the core product.

**Honest status:** product-complete, commercially early. Billing is live and **soft-gated** — inactive orgs see a banner; Search and Facilities are not hard-locked. Facility-band **copy** is live; the app does not yet block adding facilities above the subscribed band.

---

## 2. Company overview

| | |
|---|---|
| Legal name | CenterLinked Inc. |
| Location | Florida |
| Governing law | Florida (Terms of Service §13) |
| Domain | centerlinked.com |
| Category | Vertical SaaS / professional network infrastructure for behavioral-health BD |
| Phase | Phase 1 shipped |
| Access model | Invite-oriented, work-email gated |
| Billing posture | Soft-gated early access; Stripe membership and Done For You live |

**Mission:** make referral handoffs more trustworthy, easier to reopen, and safer to operate.

**How the company earns the right to exist:** BD teams already spend money on collateral that decays. CenterLinked is the persistent URL that replaces that collateral, plus the monthly verification habit that keeps it trustworthy.

**How a customer uses it, in three steps:**

1. **Claim the organization.** Request access, create a work-email account, and claim or create the treatment organization so the team has a home base.
2. **Build the profile.** Add locations, insurance contracts, levels of care, contacts, photos, and how to refer — once, in the dashboard.
3. **Share the link.** BD, admissions, and marketing send one URL (and can download a one-pager that still points back to that URL). Every reopen shows current information.

---

## 3. The problem

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

## 4. Solution and product

One persistent URL per organization, plus per-program sheets. Update the dashboard once; every partner who reopens the link sees current information.

### 4.1 The public leave-behind

- **Organization sheet** at `/o/:slug` and `/:slug` — branded profile of the org, approved non-frozen facilities, how to refer.
- **Program / facility sheet** at `/o/:org/p/:program` (legacy `/p/:slug`) — a single location or program. Frozen programs return not found.
- **Social preview:** OG HTML rewritten for crawlers so a shared link looks like the org, not a generic app card.
- **Downloadable one-pagers:** org overview and facility one-pagers generated from the live sheet — a conference leave-behind that still points at the live URL.

Public sheets honor `hidden_from_org_page` and only surface approved, non-frozen facilities.

### 4.2 Trust layer — monthly verification

| Tier | Window | Meaning |
|------|--------|---------|
| Fresh | ≤ 30 days | Verified this month |
| Recent | 31–60 days | Still usable; aging |
| Stale | 61–90 days | Needs confirmation |
| Frozen | > 90 days (or flagged) | Drops out of Search; program sheets return not found |

Verification is the product’s honesty mechanism. Catalog growth that outruns verification is a company risk, not a vanity metric.

### 4.3 Authenticated product (what the paying org operates)

- Organization setup, create, claim, and domain-based join
- Dashboard: profile, engagement (sheet views / contact clicks), shared links
- Multi-facility management: photos, BD contacts, levels of care, specializations
- Insurance contracts per facility, linked to a curated payer database
- In-app **Search** by insurance, state, city, and level of care (approved + not frozen)
- **Referral network** — preferred partner orgs, surfaced in Search
- Team members and email invites (unlimited seats)
- Monthly contract verification workflow
- PDF facility upload + parse review (Supabase Edge Functions)
- Org branding: logo, colors, cover/footer images, social links, CTAs
- Stripe billing: facility-banded membership, annual option, Done For You, Customer Portal

### 4.4 Super-admin (platform operations)

Access requests, personal-email allowlist, organization claims, join requests, facility verifications queue, payer database, org workspace create.

### 4.5 Explicitly out of Phase 1

Community **Feed** and **Messenger**. UI and tables exist. `FEATURES.community === false`. Routes redirect to `/app`. Do not turn this on until sheets + Search are clearly the habit.

---

## 5. Market

Industry backdrop (published estimates, **not** CenterLinked data): U.S. mental health and addiction treatment is a large, fragmented market. IBISWorld counts on the order of **5,128 residential mental-health / substance-abuse businesses** (2026). Licensed SUD facilities have been estimated around **17,000**. Those figures describe the industry we sell into, not software TAM, and they mix facilities with organizations.

**Bottoms-up software TAM:** U.S. behavioral-health organizations that take **professional** referrals and would pay to keep a live profile current. A defensible org-count is on the order of **5,000–15,000** (many facilities sit under one org). This is a focused vertical, not a horizontal “all healthcare” TAM.

At facility-banded pricing, ARPU is no longer a flat $1,188/year:

| Mix of 400 paying orgs | Illustrative ARR |
|---|---|
| All Profile ($99/mo) | ~$475k |
| 50% Profile / 35% Network / 15% Group | ~$1.07M |

These are **scenarios, not forecasts**. They exist to show that a cheap Profile on-ramp can still build catalog density while the ICP (multi-site groups) pays like multi-site groups.

**What we are not sizing:** consumer “rehab near me” search, patient-pay lead gen, or national directory advertising. Winning that market would require becoming a different company.

---

## 6. Customers

### Who pays

The **organization**. Checkout is restricted to `facility_admin` or `super_admin`. Typical buyers: org leadership, BD leadership, admissions / marketing.

### Who operates

BD reps, admissions, marketing. Work-email only. **Seats are unlimited** on every plan — charging per rep would punish the behavior we want (the whole BD team sharing one link).

### Who consumes the link (does not pay)

Hospitals, therapists, case managers, other BD reps, probation officers, discharge planners. They are the reason the link exists. They are never the invoice.

### ICP

Multi-location treatment orgs with an active BD team — regional groups (Network) and multi-site platforms (Group / Enterprise). They already print collateral, already work conferences, and already lose deals to stale insurance lists.

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

## 7. Competitive landscape

| Alternative | Why CenterLinked is different |
|---|---|
| PDFs / brochures / cards | Go stale; version chaos across every BD inbox |
| Org website | Wrong audience; insurance buried; not built as a leave-behind |
| Rehabs.com, Recovery.com, Psychology Today | Consumer directories; paid listings; not a professional source of truth |
| CRM (Salesforce, etc.) | Internal pipeline — does not show partners who you are |
| Paid “featured listing” directories | CenterLinked does **not** sell Search placement |
| Generic link-in-bio / microsite tools | No payer database, no monthly freeze semantics, no work-email professional network |

**Positioning line:** not a directory for families. A live referral profile for professionals.

There is no serious incumbent whose *only* job is “one verified org link for BD.” That is an advantage and a risk: the category has to be explained, not captured.

---

## 8. Business model

### Who pays

The organization. Never the referral partner. Never a pay-to-rank Search slot.

### Membership

Priced on **live facilities the org maintains**, in bands (not metered overage). Orgs upgrade when they outgrow a band.

Everything that is the product stays in every paid plan: org + program sheets, branding, insurance, contacts, unlimited team, Search, monthly verification.

Annual billing is **two months free** ($990 / $2,490 / $4,990). Enterprise (16+) is quoted, with a published floor around $799/month.

### Done For You

Labor-scaled setup on top of membership. $499 is the one-location landing number. A 10-location build is $2,500, not $499. 16+ is quoted. DFY sold below the labor it takes destroys margin on the best accounts.

### Early access (current commercial reality)

- Inactive subscriptions see a **dismissible banner**. Search and Facilities are **not** hard-locked.
- Terms §8: this may change; notice before a new price is charged.
- Facility-band **copy** is live. The app does **not** yet block adding facilities above the subscribed band.

### Unit economics (structural, not measured)

Software COGS (Supabase, Vercel, Stripe, Resend) is low relative to price. The constraint is **ops cost per org**: access review, payer curation, DFY builds, verification follow-up.

**Unknowns to fill from Stripe and admin tools (do not guess):**

- Access-request → approved → paying conversion
- Mix across Profile / Network / Group / Enterprise
- DFY attach rate
- Annual vs monthly mix
- Logo retention / churn at month 6 and 12
- Support and DFY hours per org

---

## 9. Go-to-market

Invite + request-access + work-email. **Not consumer SEO.**

1. **Founder-led BD** into treatment orgs you already know. Conference follow-up is the native use case — the link (and one-pager) is the leave-behind.
2. **Done For You** as the wedge for busy CEOs, now priced so a 10-location build is not $499.
3. **Make the public link the habit:** QR, email signature, post-meeting text, one-pager handout. The URL is the product.
4. **Density in 1–2 metros** so authenticated Search is actually useful (insurance + geography + level of care only works with catalog).
5. **Do not** buy “rehab near me.” **Do not** promise to fill beds.

Channels that fit: treatment conferences, existing BD relationships, warm intros, and the public sheet itself when a partner asks “who are you in-network with?”

Channels that do not fit: consumer paid search, patient lead marketplaces, open self-serve consumer signup.

---

## 10. Operations and technology

**Stack:** Vite 5 + React 18 SPA, TypeScript, Tailwind + shadcn/ui. Supabase (Auth, Postgres + RLS, Storage, Edge Functions). Stripe Checkout, Customer Portal, webhooks. Resend. Deployed on Vercel (SPA + `api/` serverless + `middleware.js` for OG).

**Access:** work-email gated. Personal domains blocked unless listed in `approved_personal_emails` or `bootstrap_admin_emails`. Enforced client-side (`is_email_auth_allowed`) and via `/api/auth-before-user-created`.

**Facility writes** go through `saveFacilityWithContracts` → RPC `save_facility_with_contracts`. Prefer that over ad-hoc multi-step writes.

**Stripe catalog:** one Product per plan, with monthly and annual Prices on membership products, and one-time Prices on Done For You products. Checkout uses those Price IDs. Profile $99/mo and 1-facility DFY $499 keep the existing `STRIPE_PRICE_MEMBERSHIP` and `STRIPE_PRICE_SETUP` IDs.

**Security posture that is also a sales asset:** no PHI by design, work-email gate, tenant isolation via RLS. The browser never receives `SUPABASE_SERVICE_ROLE` or other secrets.

**Ops scripts** (service-role; `--apply` writes production data): facility-image pipeline, payer backfill/seed, approve-all-facilities, contract reconcile, Stripe catalog ensure.

---

## 11. Regulatory, privacy, and brand risk

CenterLinked is an **organization profile platform**. It is not a covered entity’s clinical system and must not become one.

| Rule | Why it is existential |
|---|---|
| No patient records / PHI | A single PHI incident would redefine the company as a healthcare app it is not staffed or designed to be |
| No placement guarantee | Terms and FAQ already say this; promising beds is a legal and brand lie |
| Named in-network listings are for fit | Benefits verification stays in admissions |
| Work-email gate | Keeps the network professional and reduces consumer-directory drift |
| No paid Search rank | Selling placement would make the catalog untrustworthy |

Wrong-but-confident expansion into patient matching or PHI would destroy the company faster than slow sales.

Terms (effective August 22, 2026) and Privacy Policy are live. Fees in Terms §8 match the facility-banded catalog. Governing law and venue are **Florida**.

---

## 12. Traction

**Shipped and in production:**

- Marketing landing (problem → how it works → product proof → verification → pricing → FAQ)
- Auth (email + Google), work-email gate, access intake
- Org setup / create / claim / domain join
- Dashboard, facilities, Search, referral network, members, settings, branding
- Public org and program sheets + OG social previews
- Org and facility one-pagers
- Stripe checkout, portal, webhook idempotency, billing UI
- Monthly verification + admin verification queue
- Super-admin org, claims, access, and payer tools
- PDF upload / parse path (depends on deployed Edge Functions)

**Fill in from live systems before investor or lender use:**

| Metric | Source | Status in this plan |
|---|---|---|
| Orgs created vs approved vs paying | Admin + Stripe | Unknown — do not invent |
| Mix by Profile / Network / Group | Stripe + `organizations` | Unknown |
| Facilities live vs frozen | Admin / DB | Unknown |
| Public-link reopens and contact clicks | `org_analytics_events` / dashboard | Unknown |
| DFY attach | Stripe | Unknown |
| Access-request volume and conversion | `early_access_leads` | Unknown |
| Verify-on-time rate | `contracts_verified_at` | Unknown |

Until those are filled, describe the company as **product-complete, commercially early**.

---

## 13. 18-month operating plan (recommended)

### Months 0–6 — Density and habit

Tight ICP. Shareable link within days (DFY default for first cohort). Do not turn on community. Instrument the leave-behind: shares, QR, one-pager downloads, reopens.

**Success:** member orgs have a live link they actually send; first metro has enough approved facilities that Search is not empty.

### Months 6–12 — Catalog that Search is worth opening

One or two geographies. Instrument shares, reopens, verify-on-time rate. Sell annual in Checkout (already offered). Use DFY to land multi-site groups at Network/Group, not only Profile.

**Success:** Search is useful for a real insurance + geography query in the focus metros; annual mix is visible in Stripe.

### Months 12–18 — Enforce what we sell

Named date to hard-gate unpaid orgs (or grandfather early-access logos). Enforce facility bands on create/save if mix shows gaming. Revisit community only if sheets + Search are clearly the habit.

**Success metrics** (targets to set from real baselines, not invented here):

- % of member orgs with a fresh verification
- Public-link reopens per org per month
- Paid conversion after early access
- Logo retention at month 6 and 12
- Mix: share of revenue from Network + Group vs Profile

---

## 14. Team, financials, and funding

**Not in the product repo.** Do not send this plan to a third party with invented headcount, salaries, burn, runway, or a raise amount.

What belongs in a companion one-pager (founder-prepared, not guessed here):

- Legal capitalization and officers
- Current monthly burn and runway
- Stripe MRR / ARR and cash collected
- Whether a raise is contemplated, and for what use of proceeds
- Who operates access review, payer curation, and DFY delivery

This document is the **product and commercial plan**. It is not a substitute for financial statements.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Slow adoption | DFY wedge; founder-led; metro density; keep $99 Profile on-ramp |
| Catalog rot | Freeze semantics; do not grow faster than verification |
| Billing stays soft forever | Named date to hard-gate or grandfather |
| Facility-band gaming | Enforce caps when early access ends |
| Confused with consumer directories | Keep work-email gate; refuse patient features |
| PHI creep | Product principles; no clinical workflows |
| DFY labor overrun | Never sell $499 for a 12-site build |
| Search empty in new geos | Density before national slogans |
| Community turned on too early | Flag stays off until sheets + Search are the habit |
| Live Stripe catalog lag | Mirror the test catalog in live Stripe and Vercel env |

---

## 16. The line we will not cross

Even if a feature would be “easy”:

- Consumer treatment directory
- Patient intake, scheduling, medical advice, or clinical decision support
- PHI / patient records
- Open self-serve consumer lead generation
- Social network as the Phase-1 core
- Paid Search placement

If a request would make CenterLinked any of the above, the answer is no.

---

## 17. Why this can work

The job is real: BD teams already spend money on collateral that decays. The product is live and narrow. Trust is designed in (work email, monthly verify, freeze). Pricing matches the unit that creates work and value — **facilities** — while seats stay free so the whole BD team shares one link.

The honest constraint: this is a focused vertical SaaS. It wins by becoming the default leave-behind in professional placements, not by winning Google for “rehab.”

---

## Appendix A — Pricing catalog

Source of truth: `src/lib/pricing.ts` and `server/stripe/pricing.mjs`. Must stay in sync with landing, billing UI, Terms §8, Stripe products, and `public/llms.txt`.

**Included on every paid plan**

Organization dashboard · public shareable profile · unlimited team seats · unlimited profile updates · monthly verification · insurance and level of care listings · referral contact management · authenticated Search.

**Membership**

| Plan | Facilities | Monthly | Annual | Positioning |
|------|------------|---------|--------|-------------|
| Profile | 1 | $99 | $990 | One location. One live link. |
| Network | 2–5 | $249 | $2,490 | Regional groups. Featured as “Most groups.” |
| Group | 6–15 | $499 | $4,990 | Multi-site source of truth. |
| Enterprise | 16+ | Quote from ~$799/mo | Quote | National platforms. Request access. |

**Done For You (one-time, on top of membership)**

| Band | Amount |
|------|--------|
| 1 facility | $499 |
| 2–5 facilities | $1,200 |
| 6–15 facilities | $2,500 |
| 16+ | Quote |

Referral partners who only view a public profile are not billed.

---

## Appendix B — Shipped product surface

| Surface | Status |
|---|---|
| Landing + Privacy + Terms | Live |
| Request access | Live |
| Auth (email, Google, work-email gate) | Live |
| Org setup / claim / join | Live |
| Org dashboard | Live |
| Facilities + insurance contracts | Live |
| Monthly verification | Live |
| Authenticated Search | Live |
| Referral network | Live |
| Team members / invites | Live |
| Public org + program sheets + OG | Live |
| Org / facility one-pagers | Live |
| Stripe membership + DFY + portal | Live (soft-gated) |
| Super-admin tools | Live |
| PDF parse onboarding | Live (Edge Functions) |
| Community Feed / Messenger | Built, **gated off** |

---

## Appendix C — Open items before third-party use

Do not send this plan to an investor, bank, or large customer until the founder fills:

1. Paying org count and MRR / ARR (Stripe)  
2. Tier mix and DFY attach  
3. Access-request conversion  
4. Facilities live vs frozen; verify-on-time rate  
5. Public-link reopens per org  
6. Team, burn, runway  
7. Named date (or grandfather policy) for ending soft-gated billing  
8. Mirror the Stripe catalog and price IDs into **live** Stripe and Vercel  

---

## Appendix D — Sources and notes

- Product facts: live app at https://www.centerlinked.com, `PROJECT.md`, `PRINCIPLES.md`, `ARCHITECTURE.md`
- Pricing: `src/lib/pricing.ts`, Terms of Service §8 (effective August 22, 2026)
- Verification windows: `src/lib/verification.ts`
- Industry backdrop: IBISWorld residential MH/SA business count (2026) and published licensed-SUD facility estimates — **industry context only**, not CenterLinked TAM
- This plan does not invent customers, revenue, conversion, burn, or headcount

---

*CenterLinked Inc. · Florida · Confidential · August 22, 2026 · www.centerlinked.com*
