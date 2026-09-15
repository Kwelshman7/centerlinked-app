const KEY = "cl_search_session";
const MAX_AGE_MS = 4 * 60 * 60 * 1000;
export const SEARCH_WORK_PATH = "/app/search";

export type SearchFilterValues = {
  payerId: string | null;
  payerName: string;
  planType: string;
  state: string;
  city: string;
  zip: string;
  specialty: string;
  accreditation: string;
  loc: string;
};

/** Enough to run a search: insurance or a place/level. Plan type alone is not. */
export function hasSearchCriteria(params: URLSearchParams): boolean {
  return Boolean(
    params.get("payerId")?.trim() ||
      params.get("state")?.trim() ||
      params.get("city")?.trim() ||
      params.get("zip")?.trim() ||
      params.get("loc")?.trim(),
  );
}

export function searchParamsFromFilters(filters: SearchFilterValues): URLSearchParams {
  const q = new URLSearchParams();
  if (filters.payerId) q.set("payerId", filters.payerId);
  if (filters.payerName) q.set("payerName", filters.payerName);
  if (filters.planType) q.set("planType", filters.planType);
  if (filters.state) q.set("state", filters.state);
  if (filters.city) q.set("city", filters.city);
  if (filters.zip.trim()) q.set("zip", filters.zip.trim());
  if (filters.specialty) q.set("specialty", filters.specialty);
  if (filters.accreditation.trim()) q.set("accreditation", filters.accreditation.trim());
  if (filters.loc) q.set("loc", filters.loc);
  return q;
}

export function searchWorkHref(query: string | URLSearchParams): string {
  const encoded = typeof query === "string" ? query.replace(/^\?/, "") : query.toString();
  return encoded ? `${SEARCH_WORK_PATH}?${encoded}` : SEARCH_WORK_PATH;
}

export function searchWorkHrefFromFilters(filters: SearchFilterValues): string {
  return searchWorkHref(searchParamsFromFilters(filters));
}

/** Map a stored returnTo (work page or legacy /results) onto the current search URL. */
export function toSearchWorkHref(returnTo: string): string | null {
  if (!returnTo.startsWith(SEARCH_WORK_PATH)) return null;
  let params: URLSearchParams;
  try {
    params = new URL(returnTo, "https://centerlinked.local").searchParams;
  } catch {
    return null;
  }
  if (!hasSearchCriteria(params)) return null;
  return searchWorkHref(params);
}

export function restoreSearchHref(): string | null {
  const session = readSearchSession();
  if (!session) return null;
  return toSearchWorkHref(session.returnTo);
}

export type SearchSessionOrg = {
  slug: string;
  name: string;
  logo_url: string | null;
};

export type SearchSession = {
  returnTo: string;
  summary: string;
  orgs: SearchSessionOrg[];
  savedAt: number;
};

function write(value: string) {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    /* private mode */
  }
}

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Remember the current search so public org/facility pages can return to it. */
export function rememberSearchSession(input: Omit<SearchSession, "savedAt">) {
  const orgs = input.orgs.filter((o) => o.slug.trim());
  if (!input.returnTo.startsWith("/app/search") || orgs.length === 0) return;
  write(
    JSON.stringify({
      returnTo: input.returnTo,
      summary: input.summary,
      orgs,
      savedAt: Date.now(),
    } satisfies SearchSession),
  );
}

export function readSearchSession(): SearchSession | null {
  const raw = read();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SearchSession;
    if (!parsed?.returnTo?.startsWith("/app/search") || !Array.isArray(parsed.orgs)) return null;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    const orgs = parsed.orgs.filter((o) => o?.slug && o?.name);
    if (orgs.length === 0) return null;
    return { ...parsed, orgs };
  } catch {
    return null;
  }
}

/** Only surface search chrome when this org was in the last app search. */
export function searchSessionForOrg(orgSlug: string | null | undefined): SearchSession | null {
  const slug = orgSlug?.trim();
  if (!slug) return null;
  const session = readSearchSession();
  if (!session) return null;
  return session.orgs.some((o) => o.slug === slug) ? session : null;
}
