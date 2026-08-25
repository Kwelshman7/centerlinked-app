# server/ — Shared Node handlers

This directory is the source of truth for Stripe, email, auth-hook, OG, and ops scripts. Vercel `api/*.js` and Vite plugins must call these handlers — do not duplicate logic in only one environment.

## Layout

| Path | Role |
|------|------|
| `stripe/` | Checkout, portal, overview, webhook, `assertOrgBillingAdmin` |
| `email/` | Resend send + templates + notify/welcome handlers |
| `auth/handlers/` | Before-user-created hook |
| `og-meta.mjs` | Social-preview HTML for crawlers |
| `og-image.mjs` / `og-share.mjs` | Generated 1200×630 org share cards + same-origin favicon |
| `public-image.mjs` / `safe-image-fetch.mjs` | SSRF-hardened image proxy for PDF capture |
| `one-pager-copy.mjs` | Factual OpenAI polish for referral one-pagers |
| `lib/` | Shared helpers (e.g. payer matching) |
| `facility-images/` | Offline batch pipeline (not request-path) |
| `*.mjs` | Ops CLIs (payers, approve facilities, reconcile) |

## Rules for this tree

- Handlers return `{ status, json }`. Do not send secrets, stack traces, or raw Stripe payloads to the client.
- Billing mutations: Bearer JWT + `assertOrgBillingAdmin`. Service role is for webhook/intake/hook only.
- Webhook: verify Stripe signature; insert `stripe_webhook_events` before applying; keep retry semantics intact.
- Auth hook: verify `BEFORE_USER_CREATED_HOOK_SECRET`; call `is_email_auth_allowed`; fail closed.
- Email: Resend via existing `send.mjs` / templates. Auth-event email failures must not block login.
- Ops scripts that take `--apply` write production data. Default to dry-run behavior already in the script. Never invent a destructive flag.
- Do not put service-role or Stripe secrets in files that could ship to the browser. No `VITE_` copies of server secrets.

If a handler or env var is not in this folder or `.env` docs, do not assume it exists — read the file or ask.
