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
    /* anonymous export — server returns 401; caller uses fallback copy */
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

/** Org overview only. Does not invent facilities, insurance, or layout. */
export async function polishOrgOnePagerCopy(facts: OrgOnePagerCopyFacts): Promise<OnePagerCopyResult | null> {
  try {
    const res = await fetch("/api/one-pager-copy", {
      method: "POST",
      headers: await copyRequestHeaders(),
      body: JSON.stringify({ mode: "org", ...facts }),
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
