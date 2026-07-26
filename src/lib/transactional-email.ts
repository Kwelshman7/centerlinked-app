import { supabase } from "@/integrations/supabase/client";

export type AccessRequestNotifyPayload = {
  full_name: string;
  email: string;
  organization: string;
  role?: string;
  num_facilities?: string | number | null;
  notes?: string;
};

async function postJson(path: string, body: unknown, auth = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("You must be signed in to send this email.");
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; to?: string };
  if (!res.ok) {
    throw new Error(json.error || `Email request failed (${res.status})`);
  }
  return json;
}

/** Notify admin@centerlinked.com of a new access request. */
export async function notifyAccessRequest(payload: AccessRequestNotifyPayload) {
  return postJson("/api/notify-access-request", payload);
}

/** Send Welcome to CenterLinked after an org is verified. Super-admin only. */
export async function sendOrgWelcomeEmail(input: {
  organization_id: string;
  to_email?: string;
  to_name?: string;
}) {
  return postJson("/api/send-welcome", input, true);
}

export type AuthEmailEvent = "signup" | "login";

/**
 * Fire-and-forget signup/login emails for the signed-in user.
 * Failures are logged only — never block auth UX.
 */
export function notifyAuthEvent(event: AuthEmailEvent, fullName?: string | null) {
  void postJson(
    "/api/notify-auth-event",
    { event, full_name: fullName?.trim() || undefined },
    true,
  ).catch((err) => {
    console.warn(`[notify-auth-event:${event}]`, err);
  });
}
