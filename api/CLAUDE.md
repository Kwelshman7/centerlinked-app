# api/ — Vercel serverless entrypoints

Thin HTTP wrappers. **Do not put business logic here.** Import from `server/**` so production matches `npm run dev` (Vite plugins).

## Endpoints

| File | Handler |
|------|---------|
| `auth-before-user-created.js` | `server/auth/handlers/before-user-created.mjs` |
| `create-checkout-session.js` | `server/stripe/handlers/create-checkout-session.mjs` |
| `create-portal-session.js` | `server/stripe/handlers/create-portal-session.mjs` |
| `billing-overview.js` | `server/stripe/handlers/billing-overview.mjs` |
| `stripe-webhook.js` | `server/stripe/handlers/webhook.mjs` — **raw body**, `bodyParser: false` |
| `notify-access-request.js` | `server/email/handlers/notify-access-request.mjs` |
| `notify-auth-event.js` | `server/email/handlers/notify-auth-event.mjs` |
| `send-welcome.js` | `server/email/handlers/send-welcome.mjs` |
| `og.js` / `og-image.js` | OG HTML / image for crawlers |

## Rules for this tree

- Check method (and OPTIONS CORS) here; keep it consistent with the neighboring file.
- Parse JSON body only when the handler expects an object. Stripe webhook must keep the raw Buffer.
- Return `res.status(result.status).json(result.json)`.
- On unexpected throw: `console.error("[api/<name>]", err)` and `{ error: "Internal server error" }`.
- Do not add new `/api` routes unless asked. Client wrappers live in `src/lib/billing.ts` and `src/lib/transactional-email.ts`.
- Social bots: `middleware.js` rewrites public share paths to `/api/og`. Do not change that contract unless asked.
