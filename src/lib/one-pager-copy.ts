import { templateForFacilityCount, type OrgPrintTemplateId } from "@/lib/org-one-pager-layout";

export type OnePagerCopyFacts = {
  name: string;
  orgName?: string | null;
  city?: string | null;
  state?: string | null;
  tagline?: string | null;
  description?: string | null;
  levels: string[];
  conditions: string[];
  therapies: string[];
  whoWeTreat: string[];
  amenities: string[];
  accreditations: string[];
};

export type OnePagerCopyResult = {
  description: string | null;
  tagline?: string | null;
  template?: OrgPrintTemplateId;
  usedAi: boolean;
};

export type OrgOnePagerCopyFacts = {
  name: string;
  tagline?: string | null;
  description?: string | null;
  locationContext?: string | null;
  facilityCount: number;
  levels: string[];
  states: string[];
  facilityNames: string[];
};

async function copyRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* anonymous export — org mode still works; facility mode may 401 */
  }
  return headers;
}

/** Optional polish. Export still succeeds if this fails, is unauthorized, or OpenAI is unset. */
export async function polishOnePagerCopy(facts: OnePagerCopyFacts): Promise<OnePagerCopyResult | null> {
  try {
    const res = await fetch("/api/one-pager-copy", {
      method: "POST",
      headers: await copyRequestHeaders(),
      body: JSON.stringify(facts),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { description?: string; usedAi?: boolean };
    return {
      description: typeof json.description === "string" && json.description.trim() ? json.description.trim() : null,
      usedAi: json.usedAi === true,
    };
  } catch {
    return null;
  }
}

/**
 * Org overview + optional tagline for Export PDF.
 * Sends facilityCount so the server selects the stored prompt for
 * showcase (1–3) | portfolio (4–8) | network (9+).
 */
export async function polishOrgOnePagerCopy(facts: OrgOnePagerCopyFacts): Promise<OnePagerCopyResult | null> {
  const template = templateForFacilityCount(facts.facilityCount);
  try {
    const res = await fetch("/api/one-pager-copy", {
      method: "POST",
      headers: await copyRequestHeaders(),
      body: JSON.stringify({
        mode: "org",
        template,
        ...facts,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      description?: string;
      tagline?: string | null;
      template?: OrgPrintTemplateId;
      usedAi?: boolean;
    };
    return {
      description: typeof json.description === "string" && json.description.trim() ? json.description.trim() : null,
      tagline: typeof json.tagline === "string" && json.tagline.trim() ? json.tagline.trim() : null,
      template: json.template || template,
      usedAi: json.usedAi === true,
    };
  } catch {
    return null;
  }
}
