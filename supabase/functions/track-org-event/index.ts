// Records public-sheet engagement events for an organization.
//
// Called from the browser by `src/lib/track-org-event.ts` on public org and
// program sheets. Visitors are anonymous, so the insert cannot go through RLS:
// `org_analytics_events` has a SELECT policy for org members and no INSERT
// policy at all, so only the service role may write. That key lives here and
// never reaches the browser.
//
// Deliberately dependency-free — a plain PostgREST call keeps cold starts fast
// and removes any import that could break this path. Analytics failing must
// never be visible to a visitor, but it must also never fail silently for us:
// errors are logged, and the response still reports what happened.

const ALLOWED_EVENTS = new Set([
  "page_view",
  "share_click",
  "contact_call",
  "contact_text",
  "contact_email",
  "referral_click",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Keep free-text out of the database bounded; these are logging fields only. */
function clip(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    console.error("[track-org-event] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Not configured" }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const orgId = String(body?.org_id ?? "").trim();
  const eventType = String(body?.event_type ?? "").trim();
  const sessionId = clip(String(body?.session_id ?? ""), 100);

  if (!UUID_RE.test(orgId)) {
    return json({ error: "org_id must be a uuid" }, 400);
  }
  if (!ALLOWED_EVENTS.has(eventType)) {
    // Reject unknown types rather than storing them — get_org_engagement_stats
    // only counts these six, so anything else is silent junk in the table.
    return json({ error: "Unknown event_type" }, 400);
  }

  const rest = `${supabaseUrl}/rest/v1`;
  const auth = {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
  };

  // Confirm the organization exists before inserting. Without this a bad or
  // stale org id produces a foreign-key error on every page view.
  const orgRes = await fetch(
    `${rest}/organizations?id=eq.${orgId}&select=id&limit=1`,
    { headers: auth },
  );
  if (!orgRes.ok) {
    console.error("[track-org-event] org lookup failed:", orgRes.status, await orgRes.text());
    return json({ error: "Lookup failed" }, 502);
  }
  const orgRows = (await orgRes.json()) as Array<{ id: string }>;
  if (!orgRows.length) {
    return json({ error: "Unknown organization" }, 404);
  }

  const insertRes = await fetch(`${rest}/org_analytics_events`, {
    method: "POST",
    headers: {
      ...auth,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      organization_id: orgId,
      event_type: eventType,
      session_id: sessionId,
      referrer: clip(req.headers.get("referer"), 500),
      user_agent: clip(req.headers.get("user-agent"), 500),
    }),
  });

  if (!insertRes.ok) {
    console.error("[track-org-event] insert failed:", insertRes.status, await insertRes.text());
    return json({ error: "Could not record event" }, 502);
  }

  return json({ ok: true });
});
