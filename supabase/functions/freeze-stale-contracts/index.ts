// Super-admin trigger for the stale-facility freeze.
//
// The nightly `pg_cron` job already calls `freeze_stale_facilities()`, so this
// exists only so an admin can run it on demand from the Verifications page and
// see how many facilities were affected.
//
// `freeze_stale_facilities()` is granted to service_role only, which is why this
// cannot be a direct RPC from the browser. The UI gates the button on
// isSuperAdmin, but a UI gate is not security — the role is re-checked here.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRole || !anonKey) {
    console.error("[freeze-stale-contracts] missing environment configuration");
    return json({ error: "Not configured" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Resolve the caller from their own token, not from anything in the body.
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: anonKey },
  });
  if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
  const user = (await userRes.json()) as { id?: string };
  const uid = user?.id;
  if (!uid) return json({ error: "Unauthorized" }, 401);

  const rest = `${supabaseUrl}/rest/v1`;
  const admin = {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
  };

  const rolesRes = await fetch(
    `${rest}/user_roles?user_id=eq.${uid}&role=eq.super_admin&select=role&limit=1`,
    { headers: admin },
  );
  const roles = rolesRes.ok ? ((await rolesRes.json()) as Array<{ role: string }>) : [];
  if (!roles.length) return json({ error: "Forbidden" }, 403);

  const rpcRes = await fetch(`${rest}/rpc/freeze_stale_facilities`, {
    method: "POST",
    headers: admin,
    body: "{}",
  });

  if (!rpcRes.ok) {
    console.error("[freeze-stale-contracts] rpc failed", rpcRes.status, await rpcRes.text());
    return json({ error: "Could not run the freeze check" }, 502);
  }

  // The RPC returns an integer count of newly frozen facilities.
  const raw = await rpcRes.json();
  const frozen = typeof raw === "number" ? raw : Number(raw) || 0;

  return json({ frozen });
});
