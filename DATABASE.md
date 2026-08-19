# CenterLinked — Database Documentation

**Audience:** Senior engineers joining the project  
**Provider:** Supabase Postgres (+ Auth + Storage + Edge Functions)  
**Typed schema contract:** `src/integrations/supabase/types.ts`  
**SQL in repo:** `supabase/*.sql`, `supabase/migrations/*`  
**RLS inventory snapshot:** `supabase/migrations/00000000000000_rls_policy_snapshot.json` (75 policies)  
**Cross-reference:** `PROJECT.md` (product/architecture overview)

This document describes the **existing** production-oriented data model as evidenced by generated types, repository SQL, the RLS snapshot, and application/server usage. It does not prescribe schema changes.

### Source fidelity notes

- Many core tables were created outside the tracked migration history (dashboard / earlier one-offs). For those, **column inventories come from `types.ts`**; Postgres-level defaults/CHECK/UNIQUE beyond what appears in SQL are marked when unknown.
- `types.ts` Relationships[] lists PostgREST foreign keys that were present when types were generated. Some logical FKs used by the app are missing from that list; those are noted as logical relationships.
- Several tables appear in SQL / RLS / app code but are **absent from `types.ts`**: `bootstrap_admin_emails`, `facility_pdf_uploads`, `access_request_rate_limits`.
- The RLS snapshot may lag hardening SQL that is intended to be applied next (notably `rls-tenant-hardening.sql` and `access-request-intake-hardening.sql`). Both the snapshot and the hardening SQL are documented as facts.
- Indexes: only indexes found in repository SQL are listed. Otherwise: **Not specified in repository SQL**.

### Auth schema (Supabase-managed)

CenterLinked relies on Supabase Auth’s `auth.users` (and related Auth tables). App tables commonly store `user_id` / `*_by` columns that reference `auth.users.id`. Those Auth tables are not redefined here.

---

## Enums

### `app_role`

| Value | Meaning in product |
|-------|--------------------|
| `super_admin` | Platform operator; AdminRoute and most admin RLS paths |
| `facility_admin` | Organization admin (org profile, facilities, billing, members) |
| `bd_rep` | Standard org member / default invite and join role |

Stored in `user_roles.role`. Also mirrored loosely via `organization_members.role_at_org` / invite / join-request text fields (`facility_admin`, `bd_rep`).

`AuthContext` treats `isFacilityAdmin` as **`super_admin`** or a true `is_org_facility_admin` result for the user’s current org (`organization_members.role_at_org = facility_admin`). Global `user_roles.facility_admin` alone is not enough.

### `payer_status`

| Value | Meaning |
|-------|---------|
| `pending` | Suggested by a user; awaiting admin curation |
| `approved` | Visible for normal contract selection / search |
| `rejected` | Rejected by super admin |

### `verification_status`

| Value | Meaning |
|-------|---------|
| `pending` | Facility awaiting platform approval |
| `approved` | Publicly viewable (anon SELECT policies gate on this) |
| `rejected` | Rejected by super admin (`rejection_reason` may be set) |

**Soft verification cadence (application + columns, not a Postgres enum):** facility contract freshness uses `contracts_verified_at` + `verification_frozen`. Client tiers in `src/lib/verification.ts`: fresh ≤30d, recent 31–60d, stale 61–90d, frozen when `verification_frozen` is true (intended server flip via `freeze_stale_facilities`).

---

## Important RPCs (business logic capsules)

Definitions live partly in `supabase/*.sql`; others exist in the live DB and appear only in `types.ts` / call sites.

| RPC | Role |
|-----|------|
| `has_role(_role, _user_id)` | Core RLS helper; true if `user_roles` contains role |
| `is_org_member(_user_id, _org_id)` | Core RLS helper for tenant membership |
| `is_org_facility_admin(_org_id, _user_id)` | Super admin **or** `organization_members.role_at_org = facility_admin` for that org (no `user_roles` fallback after `membership-rpc-only.sql`) |
| `org_has_facility_admin(_org_id)` | Whether org already has a facility admin |
| `get_user_org(_user_id)` | Resolve user’s organization id |
| `link_user_to_organization(...)` | SECURITY DEFINER: upsert membership, set `profiles.organization_id`, ensure `user_roles`. **Client EXECUTE revoked** in `revoke-dangerous-grants.sql` |
| `create_organization_with_owner(...)` | Authenticated org creation + owner linkage |
| `admin_create_organization(...)` | Super-admin org bootstrap |
| `update_organization_profile(_organization_id, _profile)` | Validated non-billing org profile update |
| `save_facility_with_contracts(...)` | Atomic facility upsert + contract replace modes `all` \| `in_network` \| `none`. Sets `slug` on insert (and on update when missing). |
| `stamp_facility_verified(_facility_id)` | SECURITY DEFINER monthly stamp: sets `contracts_verified_at` / `contracts_verified_by` and clears `verification_frozen` for org members |
| `claim_pending_org_invite()` | Auto-accept pending `org_invites` by email on login. `facility_admin` is granted only if `invited_by` is an org facility admin or super admin |
| `create_org_invite` / `revoke_org_invite` | Org-admin invite writes (Members UI) |
| `get_org_setup_options()` | Domain-matched org + pending join request for setup UI |
| `request_to_join_organization(_organization_id)` | Domain-gated join request |
| `review_organization_join_request(_request_id, _approve)` | Approve/reject join (org admin or super admin) |
| `list_org_join_requests` / `list_superadmin_join_requests` | Pending join queues |
| `remove_org_member(_member_user_id, _organization_id)` | Org admin or super admin; cannot remove last facility_admin except super_admin |
| `is_personal_email_domain` / `is_email_auth_allowed` / `email_signup_eligible` | Auth eligibility gates |
| `approve_personal_email` | Super-admin allowlist insert |
| `bootstrap_super_admin` / `is_bootstrap_admin_candidate` | Allowlisted self-grant of `super_admin` |
| `consume_access_request_rate_limit` | Service-role rate limit for access-request intake |
| `get_or_create_direct_conversation(_other_user_id)` | Messaging thread bootstrap |
| `is_conversation_participant` | Messaging RLS helper |
| `get_networked_org_ids()` | Referral-network helper |
| `get_org_engagement_stats(_org_id)` | Aggregates from `org_analytics_events` |
| `freeze_stale_facilities()` / `list_facilities_due_for_verification(_days)` | Monthly verification ops. SQL in `supabase/freeze-stale-facilities.sql`. Freeze EXECUTE is **service_role only**; freezes approved facilities whose last stamp is older than 90 days |
| `slugify(_input)` | Public program slug helper |
| `run_sql(query)` | Dangerous; **EXECUTE revoked from anon/authenticated** in `revoke-dangerous-grants.sql` |
| `protect_organization_billing_columns` (trigger fn) | Blocks client writes to Stripe billing columns |
| `protect_facility_privileged_columns` (trigger fn) | Blocks client writes to approval columns and `verification_frozen` (`supabase/column-write-locks.sql`) |
| `protect_organization_verified_column` / `protect_organization_member_role` / `protect_org_invite_role` / `protect_profile_organization_id` | Column locks for `organizations.verified`, membership/invite roles, and `profiles.organization_id` |
| `enforce_facility_visibility_admin` (trigger fn) | Only org admins/super admins may change `hidden_from_org_page` |

---

## Storage buckets (data-model adjacent)

Documented in `PROJECT.md` and used by the app:

| Bucket | Typical use |
|--------|-------------|
| `facility-images` | Facility photo URLs stored on `facilities.image_urls` |
| `org-logos` | `organizations.logo_url`, `favicon_url`, cover/footer/gallery branding assets |
| `avatars` | `profiles.avatar_url` |
| `post-images` | `posts.image_urls` (community feed; feature-flagged) |
| `claim-proofs` | `organization_claims.proof_url` |
| `facility-pdfs` | Private org-scoped PDFs for `facility_pdf_uploads.storage_path` |

Edge Functions related to data: `track-org-event` (writes analytics), `parse-facility-pdf`, `extract-pdf-images`.

---

# Tables

## `profiles`

### Purpose
App-level user profile linked 1:1 (by `user_id`) to Supabase Auth. Holds display fields and the user’s current `organization_id`.

### Columns / data types (from `types.ts`)

| Column | Type (TS → Postgres convention) | Notes |
|--------|----------------------------------|-------|
| `id` | `string` (uuid) | Row primary key |
| `user_id` | `string` (uuid) | Auth user |
| `email` | `string \| null` | |
| `full_name` | `string \| null` | |
| `avatar_url` | `string \| null` | Often Storage `avatars` public URL |
| `job_title` | `string \| null` | |
| `phone` | `string \| null` | |
| `organization_id` | `string \| null` (uuid) | Current org |
| `created_at` | `string` (timestamptz) | |
| `updated_at` | `string` (timestamptz) | |

### Relationships
- FK (`profiles_organization_id_fkey`): `organization_id` → `organizations.id`
- Logical: `user_id` → `auth.users.id`

### Indexes
Not specified in repository SQL.

### Constraints / foreign keys
- Typed FK to `organizations`
- Insert/update RLS requires `auth.uid() = user_id`

### Business logic
- Created via `src/lib/ensure-profile.ts` after auth
- Updated by `link_user_to_organization` when joining an org
- Auth bootstrap loads profile + roles together (`AuthContext`)
- Hardening SQL (`rls-tenant-hardening.sql`) intends SELECT limited to self, same-org members, or super admin (snapshot still shows older broad `auth users view profiles` with `USING true` if not applied)

### Where used / files
- `src/contexts/AuthContext.tsx`, `src/lib/ensure-profile.ts`, `src/pages/app/Settings.tsx`, `src/pages/app/Members.tsx`, `src/pages/app/Messenger.tsx`, `src/hooks/useOrgTeamMembers.ts`, `src/components/app/feed/FeedSection.tsx`, `src/lib/track-org-event.ts`, `server/email/handlers/send-welcome.mjs`, `server/stripe/supabase.mjs`

### Potential risks if modified
Breaking auth session hydration, org setup redirects (`organization_id` null → `/setup-organization`), member/messenger enrichment, and join/invite linkage that writes `profiles.organization_id`.

---

## `user_roles`

### Purpose
Platform role assignments (`app_role`) for authorization and RLS.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid string | PK |
| `user_id` | uuid string | |
| `role` | `app_role` enum | |
| `created_at` | timestamptz string | |

### Relationships
- Logical: `user_id` → `auth.users.id`
- No typed Relationships in `types.ts`

### Indexes
Not specified in repository SQL.

### Constraints / foreign keys
Not fully specified in repository SQL. Unique `(user_id, role)` is commonly expected for role tables but **not confirmed in repo SQL**.

### Business logic / RLS
- `has_role()` reads this table for nearly all privileged policies
- Inserts via SECURITY DEFINER paths (`bootstrap_super_admin`, `link_user_to_organization`) or super-admin policies
- `security-hardening.sql`: authenticated clients may insert/update/delete roles only if caller is already `super_admin`; SELECT own or super admin
- Snapshot also retains older `"super admin manages roles"` ALL + `"users view own roles"` policies (possible overlap)

### Where used / files
- `src/contexts/AuthContext.tsx`, `src/lib/bootstrap-admin.ts`, `server/email/handlers/send-welcome.mjs`, `server/stripe/supabase.mjs`, RPCs in `supabase/org-join-requests.sql`, `supabase/bootstrap-super-admin.sql`

### Potential risks if modified
Privilege escalation or lockout if RLS/`has_role` semantics change; org admin detection and AdminRoute gates depend on this table.

---

## `bootstrap_admin_emails` *(not in `types.ts`)*

### Purpose
Server-only email allowlist permitted to self-grant `super_admin` via `bootstrap_super_admin`. Also treated as auth-eligible in `is_email_auth_allowed`.

### Columns / data types (from `supabase/bootstrap-super-admin.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `email` | `text` | **PRIMARY KEY** (stored lowercased by convention in RPCs) |

### Relationships
None.

### Indexes
Primary key on `email`.

### Constraints / foreign keys
- PK on `email`
- RLS enabled; **no policies** for anon/authenticated — only service role / SECURITY DEFINER

### Business logic
- `bootstrap_super_admin()` inserts `user_roles(super_admin)` when `auth.users.email` matches
- Also marks the user’s org `verified = true` if currently false
- `is_bootstrap_admin_candidate()` exposes boolean without leaking the list

### Where used / files
- `supabase/bootstrap-super-admin.sql`, `supabase/security-hardening.sql`, `supabase/approved-personal-emails.sql`
- `src/lib/bootstrap-admin.ts` (RPCs only; never selects the table from the client)

### Potential risks if modified
Accidental exposure of the allowlist; incorrect emails grant platform admin; removing RLS silence or adding SELECT policies would leak privileged emails.

---

## `approved_personal_emails`

### Purpose
Explicit exceptions allowing personal email domains (Gmail, etc.) to authenticate.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `email` | text | PK |
| `notes` | text \| null | |
| `approved_by` | uuid \| null | → `auth.users` |
| `created_at` | timestamptz | |

### Relationships
- FK in SQL: `approved_by` → `auth.users(id)` ON DELETE SET NULL

### Indexes
Primary key on `email` (SQL).

### Constraints
- PK `email`
- Super-admin-only RLS for SELECT/INSERT/UPDATE/DELETE

### Business logic
- `is_email_auth_allowed` allows personal domains only if listed here (or bootstrap list)
- `approve_personal_email` upserts rows (super admin only)
- Used when approving early-access leads that use personal emails

### Where used / files
- `supabase/approved-personal-emails.sql`
- `src/pages/app/admin/AccessRequests.tsx`, `src/lib/email-domains.ts` (via RPC), `server/auth/handlers/before-user-created.mjs` (via `is_email_auth_allowed`)

### Potential risks if modified
Opening/closing login for personal emails; Auth Before User Created hook depends on `is_email_auth_allowed` remaining correct.

---

## `early_access_leads`

### Purpose
Marketing / request-access intake queue for prospective organizations.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `full_name` | text | |
| `email` | text | |
| `organization` | text | Free-text org name |
| `facilities` | text | Free-text facilities description |
| `role` | text \| null | Added in extend/hardening SQL |
| `notes` | text \| null | Admin notes |
| `status` | text | Default `'pending'` in SQL |
| `reviewed_at` | timestamptz \| null | |
| `created_at` | timestamptz | |

### Relationships
None typed.

### Indexes
Not specified in repository SQL.

### Constraints
- `status` default `'pending'` (SQL); app treats `pending` / `approved` / rejected-like values
- Full CHECK set not specified in repository SQL

### Business logic / RLS
- Snapshot: `"anyone submits leads"` INSERT for anon+authenticated with `WITH CHECK true`
- Hardening intent (`security-hardening.sql`, `access-request-intake-hardening.sql`): drop public insert; writes via server API (`server/email/handlers/notify-access-request.mjs`) using service role + rate limit RPC
- Super-admin SELECT/UPDATE policies for Access Requests UI

### Where used / files
- `src/pages/app/admin/AccessRequests.tsx`
- `server/email/handlers/notify-access-request.mjs`, `server/email/handlers/send-welcome.mjs`
- `supabase/early-access-leads-extend.sql`, `supabase/access-request-intake-hardening.sql`, `supabase/security-hardening.sql`

### Potential risks if modified
Spam/PII intake path; if public INSERT remains while server path also inserts, duplicate/bypass risk; admin workflow depends on `status` / `reviewed_at`.

---

## `access_request_rate_limits` *(not in `types.ts`)*

### Purpose
Non-PII durable rate-limit ledger for access-request / auth notification APIs.

### Columns / data types (`access-request-intake-hardening.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `fingerprint` | text | PK; CHECK `^[a-f0-9]{64}$` |
| `window_started_at` | timestamptz | |
| `attempts` | integer | CHECK `>= 0` |
| `updated_at` | timestamptz | |

### Relationships
None.

### Indexes
Primary key on `fingerprint`.

### Constraints
- Fingerprint hex length 64; attempts ≥ 0
- RLS enabled; table privileges revoked from PUBLIC; RPC granted to `service_role` only

### Business logic
- `consume_access_request_rate_limit(_fingerprint, _max_attempts, _window_seconds)` returns whether attempt is allowed

### Where used / files
- `supabase/access-request-intake-hardening.sql`
- `server/email/handlers/notify-access-request.mjs`, `server/email/handlers/notify-auth-event.mjs`

### Potential risks if modified
Bypassing rate limits enables intake abuse; tightening incorrectly can block legitimate access requests.

---

## `organizations`

### Purpose
Central tenant entity: branded public org sheet, billing customer, membership root, facilities parent.

### Columns / data types (from `types.ts` + billing/branding SQL)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | Required |
| `slug` | text \| null | Public `/o/:slug` |
| `description` | text \| null | |
| `tagline` | text \| null | |
| `website` | text \| null | |
| `phone` | text \| null | |
| `email_domain` | text \| null | Domain match for joins/signup |
| `hq_city` / `hq_state` | text \| null | |
| `logo_url` | text \| null | Storage `org-logos` |
| `favicon_url` | text \| null | Share-link / tab icon; `org-favicon.sql` |
| `cover_image_url` | text \| null | Hero |
| `footer_image_url` | text \| null | `org-footer-image.sql` |
| `image_urls` | text[] | Gallery; `org-image-urls.sql` |
| `brand_color` / `accent_color` | text \| null | Hex validated in RPC |
| `social_*_url` | text \| null | facebook/instagram/linkedin/x — `org-social-links.sql` (required for Settings save via `update_organization_profile`) |
| `bd_contact_name` / `phone` / `email` | text \| null | |
| `cta_primary_label` / `cta_secondary_label` | text \| null | |
| `announcement` | text \| null | |
| `program_badges` | text[] | |
| `why_refer` | jsonb | Array of `{title, body}` in app |
| `num_facilities` | number \| null | |
| `verified` | boolean | Public discovery / signup domain eligibility |
| `created_by` | uuid \| null | |
| `created_at` / `updated_at` | timestamptz | |
| `stripe_customer_id` | text \| null | Unique when not null |
| `stripe_subscription_id` | text \| null | |
| `subscription_status` | text | Default `'none'`; Stripe statuses |
| `subscription_price_id` | text \| null | |
| `subscription_current_period_end` | timestamptz \| null | |
| `setup_package` | text \| null | `self_serve` \| `done_for_you` |
| `billing_email` | text \| null | |

### Relationships
- Parent of: `facilities`, `organization_members`, `organization_join_requests`, `organization_claims`, `posts`, `org_analytics_events`, `referral_network` (owner/partner), `profiles.organization_id`, invites (logical)

### Indexes (repository SQL)
- `organizations_stripe_customer_id_uidx` UNIQUE where `stripe_customer_id IS NOT NULL`
- `organizations_stripe_subscription_id_idx` where subscription id present
- `organizations_subscription_status_idx`

### Constraints / foreign keys
- Billing column comments in `org-billing.sql`
- Trigger `protect_organization_billing_columns` BEFORE UPDATE blocks non-service-role changes to Stripe/billing fields

### Business logic / RLS
- Snapshot: anon SELECT `USING true`; authenticated SELECT `USING true`; INSERT if `created_by = auth.uid()`; UPDATE for members/super admin; DELETE super admin only
- `rls-tenant-hardening.sql` replaces SELECT with: anon → `verified = true`; authenticated → verified **or** member **or** super admin
- Public sheets and search depend on `verified` + facility approval
- `email_signup_eligible` allows signup when domain matches a **verified** org (or pending invite)
- Profile updates for branding should go through `update_organization_profile` (or admin paths); billing only via Stripe webhook/checkout service role

### Storage
- `org-logos` for logo/cover/footer/gallery/favicon URLs stored as text on the row

### Where used / files
- Widespread: public `OrgSheet`, search, dashboard, settings, admin org workspace/create/edit, Stripe handlers under `server/stripe/**`, welcome email, landing carousels, feed enrichment

### Potential risks if modified
Multi-tenant root; breaking `email_domain` / `verified` breaks signup and join; billing trigger + Stripe IDs are payment-critical; slug changes break public share URLs and OG previews.

---

## `organization_members`

### Purpose
Membership of users in organizations with org-scoped role.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | FK → organizations |
| `user_id` | uuid | |
| `role_at_org` | text | Typically `facility_admin` / `bd_rep` |
| `invited_by` | uuid \| null | |
| `created_at` | timestamptz | |

### Relationships
- FK: `organization_members_organization_id_fkey` → `organizations.id`
- Logical: `user_id` → `auth.users`

### Indexes
Not specified in repository SQL.

### Constraints
Not fully specified in repository SQL (unique membership often expected).

### Business logic / RLS
- Snapshot: SELECT for all authenticated (`USING true`); ALL manage for org members or super admin
- Written primarily via `link_user_to_organization` (not directly by clients after grant revoke)
- Removal via `remove_org_member` RPC from Members UI
- `is_org_member` / `is_org_facility_admin` / `org_has_facility_admin` depend on this table

### Where used / files
- `src/pages/app/Members.tsx`, `src/pages/app/Settings.tsx`, `src/components/app/OrgDashboard.tsx`, `src/hooks/useOrgTeamMembers.ts`, `server/email/handlers/send-welcome.mjs`, `supabase/org-join-requests.sql`

### Potential risks if modified
Tenant isolation collapse if membership checks change; orphaning `profiles.organization_id` if rows deleted without RPC cleanup; open SELECT policy exposes membership graph to all authenticated users (fact from snapshot).

---

## `org_invites`

### Purpose
Email invites to join an organization before or without an existing account.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | Logical FK to organizations |
| `email` | text | |
| `role_at_org` | text | Default invite role in UI: `bd_rep` |
| `status` | text | App uses `pending`, `accepted` |
| `invited_by` | uuid \| null | |
| `accepted_at` | timestamptz \| null | |
| `created_at` | timestamptz | |

### Relationships
- No typed Relationships in `types.ts`; logical FK to `organizations`
- Consumed by `claim_pending_org_invite`, `email_signup_eligible`

### Indexes
Not specified in repository SQL.

### Constraints
Not specified in repository SQL.

### Business logic / RLS
- Org members manage invites (ALL); users can SELECT own pending invite by matching `auth.users.email`
- `claim_pending_org_invite` accepts oldest pending invite for the signed-in email, links user, marks accepted, and approves matching join requests

### Where used / files
- `src/pages/app/Members.tsx`, `src/lib/org-setup.ts`, `supabase/org-join-requests.sql`, `supabase/email-signup-eligible.sql`

### Potential risks if modified
Invite takeover if email matching loosens; signup eligibility depends on pending invites; status transitions must stay aligned with claim RPC.

---

## `organization_join_requests`

### Purpose
Domain-matched requests to join an existing organization when the user has no org yet.

### Columns / data types (SQL + types)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | DEFAULT `gen_random_uuid()` |
| `organization_id` | uuid | FK → organizations ON DELETE CASCADE |
| `user_id` | uuid | FK → auth.users ON DELETE CASCADE |
| `email` | text | |
| `email_domain` | text | |
| `status` | text | CHECK IN (`pending`,`approved`,`rejected`); default `pending` |
| `role_at_org` | text | Default `bd_rep` |
| `reviewed_by` | uuid \| null | FK auth.users ON DELETE SET NULL |
| `reviewed_at` | timestamptz \| null | |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- Typed FK: `organization_join_requests_organization_id_fkey` → `organizations.id`
- SQL FKs to `auth.users` for `user_id`, `reviewed_by`
- UNIQUE `(organization_id, user_id)`

### Indexes (SQL)
- `organization_join_requests_org_status_idx` (`organization_id`, `status`)
- `organization_join_requests_user_status_idx` (`user_id`, `status`)

### Constraints
- Status CHECK; unique per org+user
- Writes intended via SECURITY DEFINER RPCs; SELECT policy for own / org facility admin / super admin

### Business logic
- Soft gate: if org has no facility admin yet, only super admin may approve (`review_organization_join_request`)
- Domain must match `organizations.email_domain`

### Where used / files
- `supabase/org-join-requests.sql`
- `src/lib/org-setup.ts`, `src/pages/app/Members.tsx`, `src/pages/app/admin/JoinRequests.tsx`

### Potential risks if modified
Incorrect domain checks allow cross-tenant joins; bypassing “no admin yet” soft gate; unique constraint conflicts on re-request flows.

---

## `organization_claims`

### Purpose
Claims that a user represents / owns an existing organization listing (proof upload + admin review).

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | FK → organizations |
| `claimant_user_id` | uuid \| null | |
| `claimant_name` | text | |
| `claimant_email` | text | |
| `claimant_phone` | text \| null | |
| `claimant_role` | text \| null | |
| `proof_url` | text \| null | Storage `claim-proofs` |
| `notes` | text \| null | |
| `status` | text | App: `pending` / `approved` / … |
| `reviewed_by` / `reviewed_at` | uuid/timestamptz \| null | |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- Typed FK: `organization_claims_organization_id_fkey` → `organizations.id`

### Indexes
Not specified in repository SQL.

### Constraints
Not fully specified in repository SQL.

### Business logic / RLS
- Snapshot includes both older open policies (`Anyone can submit a claim` for anon+authenticated when `status = pending`) and hardening policies requiring `claimant_user_id = auth.uid()` for authenticated insert
- Super admins update/delete/view all; claimants view own
- Admin UI: `OrganizationClaims.tsx`

### Storage
- `claim-proofs` bucket for `proof_url`

### Where used / files
- `src/components/ClaimOrganizationDialog.tsx`, `src/pages/app/admin/OrganizationClaims.tsx`, `supabase/security-hardening.sql`

### Potential risks if modified
Fraudulent org takeover if review gates weaken; PII in claimant fields; duplicate claim policies in snapshot indicate careful apply-order sensitivity.

---

## `facilities`

### Purpose
Treatment locations / programs under an organization. Public program sheets, search results, insurance attachment point, monthly verification subject.

### Columns / data types (from `types.ts`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | FK → organizations |
| `name` | text | Required |
| `slug` | text \| null | Program public path |
| `tagline` / `short_description` / `description` | text \| null | |
| `address_line1` / `address_line2` | text \| null | |
| `city` / `state` / `zip` | text \| null | |
| `phone` / `website` | text \| null | |
| `capacity` | number \| null | |
| `levels_of_care` | text[] | |
| `population_served` | text[] | |
| `specializations` | text[] | |
| `accreditations` | text[] | |
| `highlights` / `quick_highlights` | text[] | |
| `image_urls` | text[] | Storage `facility-images` |
| `treatment_focus` | text \| null | |
| `insurance_status` | text \| null | Display helper |
| `featured_payer` | text \| null | |
| `bd_contact_name` / `phone` / `email` | text \| null | |
| `submitted_by` | uuid \| null | |
| `verification_status` | `verification_status` enum | |
| `verified_at` / `verified_by` | timestamptz/uuid \| null | Platform approval audit |
| `rejection_reason` | text \| null | |
| `contracts_verified_at` / `contracts_verified_by` | timestamptz/uuid \| null | Monthly contract stamp |
| `verification_frozen` | boolean | Soft gate for search prominence |
| `preferred_provider` | boolean | Admin spotlight |
| `preferred_until` | timestamptz \| null | |
| `hidden_from_org_page` | boolean | Default false; public org grid omit |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- FK: `facilities_organization_id_fkey` → `organizations.id`
- Parent of `insurance_contracts`; audit children: `contract_verifications`, `preferred_provider_changes`, `verification_reminders` (logical)

### Indexes (repository SQL)
- `facilities_org_hidden_from_org_page_idx` on (`organization_id`, `hidden_from_org_page`) WHERE `verification_status = 'approved'`

### Constraints / triggers
- Trigger `facilities_visibility_admin_only`: only super admin or org facility admin may change `hidden_from_org_page` (service role / null auth.uid bypass for jobs)

### Business logic / RLS
- Anon SELECT: `verification_status = approved`
- Authenticated SELECT: approved **or** org member **or** super admin
- Members insert/update/delete for own org; super admin ALL
- `save_facility_with_contracts` validates lengths, sets `verification_status` to `approved` for super admin creates else `pending`
- Search filters `verification_frozen = false` for prominence
- Client stamp: `stampVerified` clears freeze and sets `contracts_verified_at`

### Storage
- `facility-images` URLs in `image_urls`

### Where used / files
- Public `ProgramSheet` / `OrgSheet`, `Facilities`, `FacilityDetail`, `VerifyContracts`, `Verifications`, admin workspace, search, PDF upload commit path, `src/lib/save-facility.ts`, ops scripts `server/approve-all-facilities.mjs`, `server/facility-images/**`

### Potential risks if modified
Public SEO/share URLs (`slug`); search correctness; verification/freeze soft gates; RLS leaks of pending facilities; cascade effects on insurance contracts.

---

## `facility_pdf_uploads` *(not in `types.ts`)*

### Purpose
Tracks PDF one-pager uploads, parse status, and commit outcomes for AI-assisted facility creation.

### Columns / data types (inferred from app usage + RLS snapshot)

| Column | Type (inferred) | Evidence |
|--------|-----------------|----------|
| `id` | uuid | `.select("id")` |
| `organization_id` | uuid | Insert + RLS |
| `uploaded_by` | uuid | Insert; RLS CHECK equals `auth.uid()` |
| `filename` | text | Insert |
| `storage_path` | text | Path in `facility-pdfs` |
| `size_bytes` | number | Insert |
| `status` | text | `parsing` → `parsed` → `committed` |
| `parsed_payload` | json/jsonb | Updated after parse |
| `facilities_created` | number | Updated on commit |

Full CREATE TABLE is **not in repository SQL**.

### Relationships
- Logical FK to `organizations`; RLS uses `is_org_member(organization_id)`
- Files in Storage bucket `facility-pdfs` at `<org_id>/...`

### Indexes
Not specified in repository SQL.

### Constraints / RLS (snapshot)
- SELECT/UPDATE/DELETE: org member or super admin
- INSERT: `uploaded_by = auth.uid()` AND org member

### Business logic
- Client uploads PDF → inserts row → Edge Function `parse-facility-pdf` → optional `extract-pdf-images` → user reviews → `save_facility_with_contracts` → status `committed`

### Where used / files
- `src/pages/app/PdfFacilityUpload.tsx`
- Edge Functions `parse-facility-pdf`, `extract-pdf-images`

### Potential risks if modified
Orphan private PDFs in storage; status machine breaks review UI; missing from generated types means TypeScript will not catch schema drift.

---

## `payers`

### Purpose
Curated insurance payer directory. Facilities attach contracts by `payer_id` and/or denormalized `payer_name`.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `name` | text | Required |
| `category` | text | App default `"other"` on suggest |
| `aliases` | text[] | Matching helpers |
| `parent_company` | text \| null | |
| `status` | `payer_status` | |
| `active` | boolean | |
| `notes` | text \| null | |
| `rejection_reason` | text \| null | |
| `created_by` | uuid \| null | |
| `approved_by` / `approved_at` | uuid/timestamptz \| null | |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- Referenced by `insurance_contracts.payer_id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- INSERT: authenticated may suggest with `created_by = auth.uid()` AND `status = pending`
- SELECT: approved **or** own pending **or** super admin
- UPDATE/DELETE: super admin only

### Business logic
- Admin Insurance Database + Verifications queue for pending payers
- Ops scripts: `server/seed-missing-payers.mjs`, `server/backfill-payer-ids.mjs`, `server/lib/match-payer.mjs`

### Where used / files
- `src/components/app/facility/PayerCombobox.tsx`, `src/lib/load-approved-payers.ts`, `src/pages/app/admin/InsuranceDatabase.tsx`, `src/components/app/admin/PayerEditDrawer.tsx`, `src/pages/app/Verifications.tsx`, `src/pages/app/SearchResults.tsx`, server payer scripts

### Potential risks if modified
Search and contract integrity; renaming without alias updates breaks matching; approving/rejecting changes public insurance accuracy.

---

## `insurance_contracts`

### Purpose
Per-facility payer network rows used in search and public sheets.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `facility_id` | uuid | FK → facilities |
| `payer_id` | uuid \| null | FK → payers |
| `payer_name` | text | Denormalized display/search |
| `in_network` | boolean | |
| `plan_types` | text[] | |
| `notes` | text \| null | |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- `insurance_contracts_facility_id_fkey` → `facilities.id`
- `insurance_contracts_payer_id_fkey` → `payers.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- Anon SELECT if parent facility approved
- Authenticated SELECT if facility approved or member/super admin
- Org members ALL on contracts for their facilities; super admin ALL

### Business logic
- `save_facility_with_contracts` can DELETE+reinsert by mode
- VerifyContracts UI edits contracts then stamps verification
- Search joins `facilities!inner` through this table

### Where used / files
- `src/lib/save-facility.ts`, `VerifyContracts`, `Facilities`, `FacilityDetail`, public sheets, `SearchResults`, `Organizations`, `Settings`, `AdminOrgWorkspace`, `server/reconcile-facility-contracts.mjs`, `server/backfill-payer-ids.mjs`

### Potential risks if modified
Search false negatives/positives; denormalized `payer_name` vs `payer_id` drift; cascading deletes from facilities.

---

## `contract_verifications`

### Purpose
Audit log of monthly contract verification actions.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `facility_id` | uuid | Logical FK → facilities |
| `user_id` | uuid | Actor |
| `action` | text | App: `confirmed_no_changes`, `updated_contracts` |
| `notes` | text \| null | |
| `created_at` | timestamptz | |

### Relationships
- No typed Relationships; RLS joins `facilities` by `facility_id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- INSERT: `user_id = auth.uid()` and org member/super admin for facility’s org
- SELECT: org member/super admin for facility’s org

### Business logic
- Written by `VerifyContracts` after `stampVerified` / contract edits

### Where used / files
- `src/pages/app/VerifyContracts.tsx`

### Potential risks if modified
Loss of compliance/audit trail for monthly verification claims.

---

## `verification_reminders`

### Purpose
Records of verification reminder notifications (ops / cadence support).

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `facility_id` | uuid | |
| `organization_id` | uuid | |
| `recipient_user_id` | uuid \| null | |
| `reason` | text | |
| `created_at` | timestamptz | |

### Relationships
- No typed Relationships; logical FKs to facilities/orgs/users

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- Snapshot: SELECT for org members or super admin
- No INSERT policy in snapshot (likely service role / SECURITY DEFINER writers)

### Business logic
- Related RPCs: `list_facilities_due_for_verification`, `freeze_stale_facilities` in `supabase/freeze-stale-facilities.sql` (service_role EXECUTE for freeze)

### Where used / files
- Typed in `types.ts`; limited direct client usage found in `src/` (ops-oriented)

### Potential risks if modified
Reminder spam or missed freeze workflows if writers/readers diverge.

---

## `preferred_provider_changes`

### Purpose
Audit log when super admins toggle facility `preferred_provider` / expiry.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `facility_id` | uuid | |
| `enabled` | boolean | |
| `expires_at` | timestamptz \| null | |
| `set_by` | uuid | Must equal `auth.uid()` on insert |
| `created_at` | timestamptz | |

### Relationships
- No typed Relationships; logical FK to `facilities`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- INSERT/SELECT: super admin only; INSERT CHECK `set_by = auth.uid()`

### Business logic
- UI updates `facilities.preferred_provider` / `preferred_until` and inserts audit row

### Where used / files
- `src/components/app/admin/PreferredProviderManager.tsx`

### Potential risks if modified
Spotlight ranking integrity; audit gaps if facility flags change without rows.

---

## `referral_network`

### Purpose
Directed “preferred partner” edges between organizations for search/network UX.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `owner_org_id` | uuid | FK → organizations |
| `partner_org_id` | uuid | FK → organizations |
| `status` | text | App inserts `"preferred"` |
| `initiated_by` | uuid \| null | |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- `referral_network_owner_org_id_fkey` → `organizations.id`
- `referral_network_partner_org_id_fkey` → `organizations.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- Owner org members manage (ALL); partner org members can SELECT inbound
- RPC `get_networked_org_ids` in types

### Business logic
- `useReferralNetwork` loads partners for owner org; search may boost networked orgs

### Where used / files
- `src/hooks/useReferralNetwork.ts`, `src/components/app/network/AddPartnerOrgDialog.tsx`

### Potential risks if modified
Asymmetric edges and duplicate partners; search ranking side effects.

---

## `org_analytics_events`

### Purpose
Engagement event stream for public org sheets (views, shares, contact clicks).

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | FK → organizations |
| `event_type` | text | Client types: `page_view`, `share_click`, `contact_call`, `contact_text`, `contact_email`, `referral_click` |
| `session_id` | text \| null | |
| `referrer` | text \| null | |
| `user_agent` | text \| null | |
| `occurred_at` | timestamptz | |

### Relationships
- FK: `org_analytics_events_organization_id_fkey` → `organizations.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- Snapshot: SELECT for org members or super admin
- No client INSERT policy in snapshot — writes via Edge Function `track-org-event` (service role)

### Business logic
- Client `trackOrgEvent` skips own-org viewers; dedupes page views per session
- Dashboard aggregates via `get_org_engagement_stats`

### Where used / files
- `src/lib/track-org-event.ts`, public sheet components, `src/components/app/OrgDashboard.tsx`

### Potential risks if modified
Dashboard metrics breakage; high write volume if indexing/partitioning absent as traffic grows.

---

## `stripe_webhook_events`

### Purpose
Idempotency ledger for Stripe webhook processing.

### Columns / data types (SQL)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | Stripe event id; **PRIMARY KEY** |
| `type` | text | Event type |
| `livemode` | boolean \| null | |
| `created_at` | timestamptz | Default `now()` |

### Relationships
None.

### Indexes
Primary key on `id`.

### Constraints / RLS
- RLS enabled; **no anon/authenticated policies**; privileges revoked from PUBLIC/anon/authenticated — service role only

### Business logic
- `server/stripe/handlers/webhook.mjs` inserts before processing and may delete on failure paths for retry semantics

### Where used / files
- `supabase/stripe-webhook-events.sql`, `server/stripe/handlers/webhook.mjs`, `api/stripe-webhook.js`

### Potential risks if modified
Duplicate subscription updates or lost events; billing desync with `organizations` Stripe columns.

---

## `posts`

### Purpose
Organization network feed posts (community feature; UI gated by `FEATURES.community`).

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `organization_id` | uuid | FK → organizations |
| `author_id` | uuid | |
| `content` | text | |
| `image_urls` | text[] | Storage `post-images` |
| `created_at` / `updated_at` | timestamptz | |

### Relationships
- FK: `posts_organization_id_fkey` → `organizations.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- Authenticated SELECT all posts (`USING true`)
- INSERT: author self + org member
- UPDATE: author or super admin
- DELETE: author, super admin, or org member

### Business logic
- Realtime subscription on INSERT in `FeedSection`
- Feature flag currently redirects `/app/feed` when community disabled; **tables remain live**

### Where used / files
- `src/components/app/feed/FeedSection.tsx`, `src/App.tsx` feature flag

### Potential risks if modified
Broad authenticated read of all posts; enabling community increases abuse surface under current RLS.

---

## `post_likes`

### Purpose
Likes on feed posts.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `post_id` | uuid | FK → posts |
| `user_id` | uuid | |
| `created_at` | timestamptz | |

### Relationships
- FK: `post_likes_post_id_fkey` → `posts.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- SELECT all authenticated; INSERT as self; DELETE own likes

### Business logic
- Table + RLS exist; Feed UI in repo does not currently wire like toggles (types/policies ready)

### Where used / files
- Typed + RLS snapshot; limited/no UI usage in current FeedSection

### Potential risks if modified
Orphan likes if posts deleted without CASCADE (CASCADE not confirmed in repo SQL).

---

## `conversations`

### Purpose
Direct-message conversation headers.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `created_by` | uuid | |
| `last_message_at` | timestamptz | |
| `created_at` | timestamptz | |

### Relationships
- Participants/messages reference this id
- Created via `get_or_create_direct_conversation`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- SELECT/UPDATE only if `is_conversation_participant(auth.uid(), id)`

### Business logic
- Community Messenger gated by `FEATURES.community`

### Where used / files
- `src/pages/app/Messenger.tsx` (via RPC + participants/messages)

### Potential risks if modified
DM privacy depends entirely on participant helper + RLS remaining correct.

---

## `conversation_participants`

### Purpose
Membership of users in conversations; read cursors.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `conversation_id` | uuid | FK → conversations |
| `user_id` | uuid | |
| `last_read_at` | timestamptz | |
| `created_at` | timestamptz | |

### Relationships
- FK: `conversation_participants_conversation_id_fkey` → `conversations.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- SELECT: own row or participant of conversation
- UPDATE: own participant row (read receipts)

### Business logic
- Messenger lists conversations by participant rows; updates `last_read_at`

### Where used / files
- `src/pages/app/Messenger.tsx`

### Potential risks if modified
Leaking conversation membership; broken unread state.

---

## `messages`

### Purpose
Direct messages within a conversation.

### Columns / data types

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `conversation_id` | uuid | FK → conversations |
| `sender_id` | uuid | |
| `content` | text | |
| `created_at` | timestamptz | |

### Relationships
- FK: `messages_conversation_id_fkey` → `conversations.id`

### Indexes
Not specified in repository SQL.

### Constraints / RLS
- SELECT/INSERT for participants; INSERT requires `sender_id = auth.uid()`
- DELETE own messages

### Business logic
- Messenger inserts messages and reads latest for preview list

### Where used / files
- `src/pages/app/Messenger.tsx`

### Potential risks if modified
Cross-conversation message leakage if participant checks break; no soft-delete model in schema.

---

# Overall Entity Relationship

```text
auth.users
    │
    ├── profiles (organization_id) ──────────────┐
    ├── user_roles (app_role)                    │
    ├── organization_members                     │
    ├── org_invites (email match)                │
    ├── organization_join_requests               │
    ├── organization_claims                      │
    ├── conversation_participants / messages     │
    ├── posts / post_likes                       │
    └── approved_personal_emails.approved_by     │
                                                 ▼
                                         organizations
                                          │    │    │
                    ┌─────────────────────┤    │    └────────────┐
                    ▼                     ▼    ▼                 ▼
               facilities          org_invites / members   posts / analytics
                    │              join_requests / claims   referral_network
                    ├── insurance_contracts → payers
                    ├── contract_verifications
                    ├── verification_reminders
                    ├── preferred_provider_changes
                    └── facility_pdf_uploads (org-scoped; untyped)

bootstrap_admin_emails ──RPC──► user_roles.super_admin
early_access_leads / access_request_rate_limits  (intake)
stripe_webhook_events ──service──► organizations billing columns
conversations ←── conversation_participants / messages
```

**Core cardinality facts**
- One user profile; many role rows
- One org has many members, facilities, posts, analytics events
- One facility has many insurance contracts
- Referral network is directed owner→partner
- Messaging is conversation-centric with N participants

---

# Authentication Tables

| Table | Auth role |
|-------|-----------|
| `auth.users` (Supabase) | Canonical identity |
| `profiles` | App profile + current org |
| `user_roles` | Platform RBAC |
| `bootstrap_admin_emails` | Silent super-admin allowlist |
| `approved_personal_emails` | Personal-email exceptions |
| `early_access_leads` | Pre-auth commercial intake |
| `access_request_rate_limits` | Intake abuse control |
| `org_invites` | Pre-membership email tickets (`email_signup_eligible`) |

**Enforcement layers (facts)**
1. Client RPC `is_email_auth_allowed` / related checks
2. HTTPS Auth Hook → `/api/auth-before-user-created` calling `is_email_auth_allowed` with service role
3. Post-login `bootstrap_super_admin` / `claim_pending_org_invite` / org setup RPCs

---

# Organization Relationships

- **Tenant root:** `organizations`
- **Membership:** `organization_members` + `profiles.organization_id` (kept in sync by `link_user_to_organization`)
- **Invite path:** `org_invites` → claim RPC → membership
- **Domain join path:** `organization_join_requests` (domain must match `email_domain`; admin/super-admin review)
- **Claim path:** `organization_claims` + `claim-proofs` storage → super-admin review
- **Branding/public:** slug, verified flag, colors, images, socials, `why_refer`
- **Billing:** Stripe columns protected by trigger; ledger in `stripe_webhook_events`
- **Network:** `referral_network` preferred partners
- **Analytics:** `org_analytics_events` via Edge Function

---

# Facility Relationships

- Belong to exactly one `organizations` row
- Public visibility soft gates: `verification_status = approved`, optional `hidden_from_org_page`, contract freshness via `contracts_verified_at` / `verification_frozen`
- Insurance: child `insurance_contracts` (+ payer directory)
- Verification audit: `contract_verifications`, reminders, preferred-provider audit
- Media: `facility-images`; PDF ingest: `facility-pdfs` + `facility_pdf_uploads`
- Write path of record for create/edit+contracts: RPC `save_facility_with_contracts`

---

# Insurance Relationships

```text
payers (status: pending|approved|rejected)
    ▲
    │ payer_id (nullable)
insurance_contracts
    │
    ▼
facilities ──monthly──► contracts_verified_* / verification_frozen
                 └──audit──► contract_verifications
```

- Search typically requires approved facilities, non-frozen verification, and in-network contracts joined to payers
- Pending payers remain visible to suggester and super admins; contracts may still reference them

---

# Messaging Relationships

```text
get_or_create_direct_conversation(other_user)
        ▼
  conversations
     │
     ├── conversation_participants (user_id, last_read_at)
     └── messages (sender_id, content)
```

- RLS hinges on `is_conversation_participant`
- UI currently feature-flagged (`FEATURES.community === false` redirects), but schema/policies remain

---

# Permissions

### Platform roles (`app_role` via `user_roles`)
- **`super_admin`:** manage orgs/facilities/payers/claims/leads/roles; bootstrap path; bypass many RLS checks via `has_role`
- **`facility_admin`:** org administration (also represented in `organization_members.role_at_org`)
- **`bd_rep`:** standard member

### Helper functions used in RLS
- `has_role`, `is_org_member`, `is_org_facility_admin`, `is_conversation_participant`

### Notable policy facts from snapshot + hardening SQL
- Many tables enable RLS; `stripe_webhook_events`, `bootstrap_admin_emails`, `access_request_rate_limits` are service/DEFINER oriented with no client policies
- Snapshot still shows broad SELECT on `organizations`, `profiles`, `organization_members`, `posts`, `post_likes` for authenticated users — `rls-tenant-hardening.sql` narrows **organizations** and **profiles** when applied; `membership-rpc-only.sql` narrows **organization_members** SELECT to own org / super_admin and removes client INSERT/UPDATE/DELETE
- `organization_claims` and `early_access_leads` show overlapping legacy + hardened policies in snapshot/SQL history — apply order matters (`security-hardening.sql` / `access-request-intake-hardening.sql` drop leftover public INSERTs)
- Billing columns on `organizations` are RLS-updatable for members in general UPDATE policy, but trigger rejects billing field changes for non-service roles
- Privileged columns (`facilities` approval/freeze, `organizations.verified`, `organization_members.role_at_org`, `org_invites.role_at_org`, `profiles.organization_id`) are trigger-locked in `column-write-locks.sql`
- Dangerous `run_sql` and direct `link_user_to_organization` client EXECUTE are revoked in `revoke-dangerous-grants.sql`

### Soft gates (not always hard DB constraints)
- Work-email / personal allowlist for Auth
- Org `verified` for public anon discovery (after hardening) and domain signup eligibility
- Facility `verification_status` = `approved` **and** `verification_frozen` = false for Search, in-app directories, and public sheets (`src/lib/facility-visibility.ts`). Org sheets also honor `hidden_from_org_page`.
- Join approval when org lacks a facility admin (super admin required)
- Community UI feature flag (DB still open to authenticated per RLS)

---

# Future Scalability Notes

These are **observed scaling/risk facts** about the current model (not recommendations for redesign):

1. **SPA + anon key + RLS:** Nearly all product reads/writes go through the browser. Correctness equals RLS + SECURITY DEFINER RPC quality. Policy drift between snapshot and hardening SQL is an operational risk.
2. **Schema drift surfaces:** `facility_pdf_uploads`, `bootstrap_admin_emails`, and `access_request_rate_limits` can lag `types.ts`. Confirm live apply with `supabase/inspect-live-security.sql`.
3. **Analytics append-only growth:** `org_analytics_events` has no indexes specified in repo SQL; `get_org_engagement_stats` will dominate as event volume grows.
4. **Search join shape:** Insurance search walks `insurance_contracts → facilities → organizations` with filters on enums/flags; missing indexes in repo SQL means production may rely on untracked indexes or sequential scans.
5. **Denormalized payer names** on contracts require reconciliation scripts (`server/reconcile-facility-contracts.mjs`, `backfill-payer-ids.mjs`) as the payer dictionary evolves.
6. **Community tables are already multi-tenant-global** (authenticated can read all posts/likes under snapshot policies). Enabling `FEATURES.community` increases product surface without a separate schema.
7. **Messaging** lacks archive/soft-delete/pagination indexes in repo SQL; realtime feed currently listens to `posts` inserts.
8. **Billing idempotency** depends on `stripe_webhook_events` primary key + service-role updates; filesystem on Vercel is ephemeral — durable state is Postgres/Stripe/Storage only.
9. **Storage URLs as text columns** (not FK to Storage objects): deleting Storage objects does not cascade to table fields; orphan URLs are possible.
10. **Monthly verification** uses client `stamp_facility_verified` plus `freeze_stale_facilities` in `supabase/freeze-stale-facilities.sql` (must still be scheduled in Dashboard/pg_cron).

---

## Repository SQL map (apply/reference)

| File | Concern |
|------|---------|
| `supabase/bootstrap-super-admin.sql` | `bootstrap_admin_emails` + bootstrap RPC |
| `supabase/security-hardening.sql` | user_roles / claims / leads / bootstrap candidate RPC |
| `supabase/approved-personal-emails.sql` | Personal email allowlist + auth RPCs |
| `supabase/email-signup-eligible.sql` | Invite/domain signup helper |
| `supabase/org-join-requests.sql` | Join requests table + membership RPCs |
| `supabase/save-facility-with-contracts.sql` | Facility/org profile write RPCs |
| `supabase/org-billing.sql` | Stripe columns + indexes |
| `supabase/stripe-webhook-events.sql` | Webhook ledger + billing trigger |
| `supabase/access-request-intake-hardening.sql` | Rate limits + lead columns; service-only intake |
| `supabase/rls-tenant-hardening.sql` | Tighten org/profile SELECT |
| `supabase/revoke-dangerous-grants.sql` | Revoke `run_sql` / tighten EXECUTE |
| `supabase/facility-*.sql` / `org-*.sql` | Column additive patches |
| `supabase/column-write-locks.sql` | Privileged-column triggers + `stamp_facility_verified` |
| `supabase/membership-rpc-only.sql` | Members/invites RPC-only + `remove_org_member` |
| `supabase/freeze-stale-facilities.sql` | Freeze RPC (service_role) + due-list |
| `supabase/inspect-live-security.sql` | Read-only apply-state inspection |
| `supabase/migrations/20260802120000_production_security_bundle.sql` | Ordered apply checklist (docs-only `SELECT 1`) |
| `supabase/migrations/00000000000000_rls_policy_snapshot.json` | Captured policy inventory |

---

*Generated from repository sources for engineer onboarding. Confirm live Supabase schema before assuming every one-off SQL file has been applied.*
