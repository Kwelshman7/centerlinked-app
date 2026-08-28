import { createClient } from "@supabase/supabase-js";

function supabaseAuthed(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !accessToken) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verify a Supabase access token. Used for cost-bearing APIs that any
 * signed-in user may call (not billing-admin gated).
 */
export async function assertAuthenticated(accessToken) {
  if (!accessToken) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const client = supabaseAuthed(accessToken);
  if (!client) {
    return { ok: false, error: "Auth not configured", status: 500 };
  }

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  return {
    ok: true,
    userId: userData.user.id,
    email: userData.user.email || null,
  };
}
