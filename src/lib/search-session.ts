const KEY = "cl_search_session";
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

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
