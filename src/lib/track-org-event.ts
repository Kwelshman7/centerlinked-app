import { supabase } from "@/integrations/supabase/client";

export type OrgEventType =
  | "page_view"
  | "share_click"
  | "contact_call"
  | "contact_text"
  | "contact_email"
  | "referral_click";

const SESSION_KEY = "cl_analytics_session";
const SENT_PAGE_VIEWS_KEY = "cl_analytics_pv_sent";

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

async function isOwnOrgViewer(orgId: string): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return false;
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", uid)
      .maybeSingle();
    return prof?.organization_id === orgId;
  } catch {
    return false;
  }
}

export async function trackOrgEvent(
  orgId: string,
  eventType: OrgEventType,
): Promise<void> {
  try {
    // Skip if this is a member of the org viewing their own page
    if (await isOwnOrgViewer(orgId)) return;

    // Dedup page_view per session per org
    if (eventType === "page_view") {
      try {
        const raw = sessionStorage.getItem(SENT_PAGE_VIEWS_KEY);
        const sent: string[] = raw ? JSON.parse(raw) : [];
        if (sent.includes(orgId)) return;
        sent.push(orgId);
        sessionStorage.setItem(SENT_PAGE_VIEWS_KEY, JSON.stringify(sent));
      } catch {
        /* ignore */
      }
    }

    await supabase.functions.invoke("track-org-event", {
      body: {
        org_id: orgId,
        event_type: eventType,
        session_id: getSessionId(),
      },
    });
  } catch {
    /* swallow — analytics must never break the UX */
  }
}
