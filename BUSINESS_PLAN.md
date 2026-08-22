# CenterLinked Inc. — Business Plan

**Confidential · August 21, 2026**  
**Entity:** CenterLinked Inc.  
**Product:** https://www.centerlinked.com  
**Status:** Production, early-access posture (membership live; billing is soft-gated)

This plan is grounded in the live product, Terms of Service (effective August 21, 2026), and public positioning. Operating numbers (customers, ARR, conversion, burn) are not invented here.

---

## 1. Executive summary

CenterLinked is a **B2B professional referral platform** for behavioral-health and addiction-treatment organizations. It replaces stale PDFs, brochures, and business cards with **one live, branded organization link** that referral partners can reopen: who the org is, where facilities are, what they treat, which insurance they are in-network with, and who to contact.

The people who **maintain** the product are BD, admissions, and marketing teams. The people who **reopen the link** are hospitals, discharge planners, case managers, therapists, other BD reps, and probation officers.

**Why this exists:** treatment orgs lose referrals when partners work from outdated one-pagers. Insurance networks change, BD contacts rotate, locations open, and levels of care shift. A PDF does not.

**Commercial model:** membership is priced by **live facilities**, not seats. Referral partners who only view a public profile are not billed. Search placement is not for sale.

| Plan | Live facilities | Monthly | Annual (2 months free) |
|------|-----------------|---------|------------------------|
| Profile | 1 | $99 | $990 |
| Network | 2–5 | $249 | $2,490 |
| Group | 6–15 | $499 | $4,990 |
| Enterprise | 16+ | Custom (floor ~$799/mo) | Custom |

**Done For You** (one-time, on top of membership): $499 (1 facility), $1,200 (2–5), $2,500 (6–15), quote for 16+.

**What we are not:** a consumer treatment directory, a patient portal, a PHI store, a lead-gen marketplace, or a social network as the core product. Feed and Messenger exist in the codebase and are gated off.

---

## 2. Company overview

| | |
|---|---|
| Legal name | CenterLinked Inc. |
| Governing law | Delaware (Terms §13) |
| Domain | centerlinked.com |
| Category | Vertical SaaS / professional network infrastructure for behavioral-health BD |
| Phase | Phase 1 shipped: public org/program sheets, authenticated Search, facility + insurance truth, monthly verification, org dashboard, Stripe, super-admin curation |
| Access model | Invite-oriented, work-email gated |

**Mission:** make referral handoffs more trustworthy, easier to reopen, and safer to operate.

---

## 3. The problem

Behavioral-health BD is relationship-driven. Placement decisions need four facts fast: **level of care, insurance fit, location, and a real person to call**.

Today those facts live in PDFs that go stale, marketing websites built for patients, consumer directories that are vague on named in-network payers, and CRMs that are internal. The cost is missed and misrouted referrals.

CenterLinked does **not** guarantee placements. It reduces friction so the right partner can confirm fit and reach the right contact.

---

## 4. Solution and product

One persistent URL per organization plus per-program sheets. Update the dashboard once; every partner who reopens the link sees current information.

**Trust layer:** monthly verification — fresh (≤30d), recent (31–60d), stale (61–90d), frozen (>90d). Frozen facilities drop out of Search.

**Authenticated product:** org dashboard, branding, multi-facility management, insurance contracts, Search, referral network, team invites, PDF onboarding, Stripe billing.

**Explicitly out of Phase 1:** Community Feed and Messenger (`FEATURES.community = false`).

---

## 5. Market

Industry backdrop (published estimates, not CenterLinked data): U.S. mental health and addiction treatment centers are a large, fragmented market. IBISWorld counts ~5,128 residential MH/SA businesses (2026); licensed SUD facilities have been estimated around 17,000. Those figures describe the industry we sell into, not software TAM.

**Bottoms-up software TAM:** U.S. behavioral-health organizations that take professional referrals. A defensible org-count is on the order of 5,000–15,000 (facilities often sit under one org).

At facility-banded pricing, ARPU is no longer a flat $1,188:

| Mix of 400 paying orgs | Illustrative ARR |
|---|---|
| All Profile ($99) | $475k |
| 50% Profile / 35% Network / 15% Group | ~$1.07M |

These are scenarios, not forecasts. Catalog density still wants a cheap Profile on-ramp; the ICP (multi-site groups) now pays like multi-site groups.

---

## 6. Customers

**Buyer (pays):** facility admin / org leadership, BD leadership, admissions / marketing. Checkout is restricted to facility_admin or super_admin.

**User (operates):** BD reps, admissions, marketing. Work-email only. **Seats are unlimited** on every plan — charging per rep would punish sharing the link.

**Consumer of the link (does not pay):** hospitals, therapists, case managers, other BD reps, probation officers.

**ICP:** multi-location treatment orgs with an active BD team. **Anti-ICP:** consumer SEO shops and anyone who wants CenterLinked to “get us patients from Google.”

---

## 7. Competitive landscape

| Alternative | Why CenterLinked is different |
|---|---|
| PDFs / brochures / cards | Go stale; version chaos |
| Org website | Wrong audience; insurance buried |
| Rehabs.com, Recovery.com, Psychology Today | Consumer directories |
| CRM | Internal pipeline — does not show partners who you are |
| Paid “featured listing” directories | CenterLinked does not sell Search placement |

**Positioning:** not a directory for families. A live referral profile for professionals.

---

## 8. Business model

### Who pays

The **organization**. Never the referral partner. Never a pay-to-rank Search slot.

### Membership

Priced on **live facilities the org maintains**, in bands (not metered overage). Upgrades when they outgrow a band.

Everything that is the product stays in every paid plan: org + program sheets, branding, insurance, contacts, unlimited team, Search, monthly verification.

### Done For You

Labor-scaled setup. $499 is the one-location landing number; larger orgs are not built at a loss.

### Early access

Inactive subscriptions see a banner; Search/Facilities are **not** hard-locked. Terms §8: this may change. Facility-band **copy** is live; the app does **not** yet block adding facilities above the subscribed band.

### Unit economics (structural)

Software COGS (Supabase, Vercel, Stripe, Resend) is low. The constraint is **ops cost per org**: access review, payer curation, DFY builds. DFY must match facility count or it destroys margin on the best accounts.

**Unknowns to fill from Stripe:** conversion from access-request → paying, mix across tiers, DFY attach, annual mix, churn.

---

## 9. Go-to-market

Invite + request-access + work-email. Not consumer SEO.

1. Founder-led BD into treatment orgs you already know. Conference follow-up is the native use case.
2. Done For You as the wedge for busy CEOs — now priced so a 10-location build is not $499.
3. Make the public link the leave-behind (QR, email signature, post-meeting text).
4. Density in 1–2 metros so Search is actually useful.
5. Do not buy “rehab near me.” Do not promise to fill beds.

---

## 10. Operations and technology

Vite + React SPA, Supabase (Auth, Postgres + RLS, Storage, Edge Functions), Stripe, Resend, Vercel.

Profile $99/mo and 1-facility DFY $499 use existing Stripe price IDs (`STRIPE_PRICE_MEMBERSHIP`, `STRIPE_PRICE_SETUP`). Network, Group, annual, and larger DFY packages are created at Checkout via `price_data` until dedicated Stripe prices exist.

Security posture that is also a sales asset: no PHI by design, work-email gate, tenant isolation via RLS.

---

## 11. Regulatory, privacy, and brand risk

CenterLinked is an organization profile platform. Do not store patient records. No placement guarantee. Named in-network listings are for fit; benefits verification stays in admissions. Wrong-but-confident expansion into patient matching or PHI would destroy the company faster than slow sales.

---

## 12. Traction

**Shipped:** landing, auth, access intake, org setup/claim, dashboard, facilities, Search, public sheets + OG, Stripe, monthly verification, super-admin tools.

**Fill in before investor use:** orgs created vs. approved vs. paying, mix by tier, facilities live vs. frozen, public-link reopens, DFY attach, access-request volume.

Until those are filled, describe the company as **product-complete, commercially early**.

---

## 13. 18-month operating plan (recommended)

**Months 0–6 — Density and habit.** Tight ICP. Shareable link within days (DFY default for first cohort). Do not turn on community.

**Months 6–12 — Catalog that Search is worth opening.** One or two geographies. Instrument shares, reopens, verify-on-time rate. Sell annual in Checkout (already offered).

**Months 12–18 — Enforce what we sell.** Named date to hard-gate unpaid orgs. Enforce facility bands on create/save if mix shows gaming. Revisit community only if sheets + Search are clearly the habit.

Success metrics: % of member orgs with a fresh verification; public-link reopens per org per month; paid conversion after early access; logo retention at month 6 and 12.

---

## 14. Team, financials, and funding

Not in the product repo. Do not send this plan to a third party with invented headcount, burn, or a raise amount.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Slow adoption | DFY wedge; founder-led; metro density; keep $99 Profile on-ramp |
| Catalog rot | Freeze semantics; don’t grow faster than verification |
| Billing stays soft forever | Named date to hard-gate or grandfather |
| Facility-band gaming | Enforce caps when early access ends |
| Confused with consumer directories | Keep work-email gate; refuse patient features |
| PHI creep | Product principles; no clinical workflows |
| DFY labor overrun | Never sell $499 for a 12-site build |

---

## 16. The line we will not cross

Even if a feature would be “easy”: consumer treatment directory; patient intake, scheduling, medical advice, or clinical decision support; PHI / patient records; open self-serve consumer lead generation; social network as the Phase-1 core; paid Search placement.

---

## 17. Why this can work

The job is real: BD teams already spend money on collateral that decays. The product is live and narrow. Trust is designed in (work email, monthly verify, freeze). Pricing now matches the unit that creates work and value — **facilities** — while seats stay free so the whole BD team shares one link.

The honest constraint: this is a focused vertical SaaS. It wins by becoming the default leave-behind in professional placements, not by winning Google for “rehab.”
