export type ConnectionStatus =
  | "none"
  | "self"
  | "pending"
  | "pending_out"
  | "pending_in"
  | "accepted"
  | "declined"
  | "blocked";

export interface ProfessionalOrgCard {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hq_city?: string | null;
  hq_state?: string | null;
  verified?: boolean | null;
}

export interface ProfessionalCard {
  user_id: string;
  full_name: string | null;
  job_title: string | null;
  avatar_url: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  organization: ProfessionalOrgCard | null;
  connection_status?: ConnectionStatus;
  connection_id?: string | null;
  connected_at?: string | null;
  created_at?: string | null;
}

export interface ProfessionalFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  levels_of_care: string[];
  payers: string[];
  image_urls?: string[];
  short_description?: string | null;
  tagline?: string | null;
  description?: string | null;
}

export interface ProfessionalProfileData extends ProfessionalCard {
  facilities: ProfessionalFacility[];
}

export interface PublicReferralContact {
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  user_id: string | null;
}

const CONNECT_KEY = "cl_connect_user_id";

export function professionalPath(userId: string): string {
  return `/app/people/${userId}`;
}

export function connectSharePath(userId: string): string {
  return `/join?connect=${encodeURIComponent(userId)}`;
}

export function connectShareUrl(origin: string, userId: string): string {
  return `${origin}${connectSharePath(userId)}`;
}

export function rememberConnectUser(userId: string | null | undefined) {
  if (!userId) return;
  try {
    sessionStorage.setItem(CONNECT_KEY, userId);
  } catch {
    /* ignore */
  }
}

export function consumeConnectUser(): string | null {
  try {
    const value = sessionStorage.getItem(CONNECT_KEY);
    if (value) sessionStorage.removeItem(CONNECT_KEY);
    return value;
  } catch {
    return null;
  }
}

export function peekConnectUser(): string | null {
  try {
    return sessionStorage.getItem(CONNECT_KEY);
  } catch {
    return null;
  }
}

export function initialsFromName(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function locationLine(city?: string | null, state?: string | null): string | null {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function lastNameSortKey(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toLowerCase();
}

export function letterForName(name: string | null | undefined): string {
  const ch = lastNameSortKey(name).charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

export function compareByLastName(a: ProfessionalCard, b: ProfessionalCard): number {
  const ka = lastNameSortKey(a.full_name);
  const kb = lastNameSortKey(b.full_name);
  if (ka !== kb) return ka.localeCompare(kb);
  return (a.full_name ?? "").localeCompare(b.full_name ?? "");
}

export function personMatchesQuery(person: ProfessionalCard, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    person.full_name,
    person.job_title,
    person.organization?.name,
    person.city,
    person.state,
    person.organization?.hq_city,
    person.organization?.hq_state,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function nameSearchScore(person: ProfessionalCard, query: string): number {
  const needle = query.trim().toLowerCase();
  const name = (person.full_name ?? "").toLowerCase();
  if (!needle || !name) return 9;
  if (name.startsWith(needle)) return 0;
  if (name.split(/\s+/).some((part) => part.startsWith(needle))) return 1;
  if (name.includes(needle)) return 2;
  return 9;
}

export function compareNameSearch(query: string, a: ProfessionalCard, b: ProfessionalCard): number {
  const delta = nameSearchScore(a, query) - nameSearchScore(b, query);
  if (delta !== 0) return delta;
  return compareByLastName(a, b);
}

export function personState(person: ProfessionalCard): string | null {
  const state = (person.state || person.organization?.hq_state || "").trim();
  return state || null;
}

export function uniqueStates(people: ProfessionalCard[]): string[] {
  const states = new Set<string>();
  for (const person of people) {
    const state = personState(person);
    if (state) states.add(state.toUpperCase());
  }
  return Array.from(states).sort((a, b) => a.localeCompare(b));
}

export function groupByLetter(people: ProfessionalCard[]): { letter: string; people: ProfessionalCard[] }[] {
  const map = new Map<string, ProfessionalCard[]>();
  for (const person of [...people].sort(compareByLastName)) {
    const letter = letterForName(person.full_name);
    const list = map.get(letter) ?? [];
    list.push(person);
    map.set(letter, list);
  }
  return Array.from(map.entries()).map(([letter, group]) => ({ letter, people: group }));
}

export function groupByOrganization(people: ProfessionalCard[]): { key: string; label: string; people: ProfessionalCard[] }[] {
  const map = new Map<string, { label: string; people: ProfessionalCard[] }>();
  for (const person of [...people].sort(compareByLastName)) {
    const key = person.organization?.id || "independent";
    const label = person.organization?.name || "Independent";
    const entry = map.get(key) ?? { label, people: [] };
    entry.people.push(person);
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      if (a.key === "independent") return 1;
      if (b.key === "independent") return -1;
      return a.label.localeCompare(b.label);
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function asProfessionalOrg(value: unknown): ProfessionalOrgCard | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  return {
    id: value.id,
    name: value.name,
    slug: typeof value.slug === "string" ? value.slug : null,
    logo_url: typeof value.logo_url === "string" ? value.logo_url : null,
    hq_city: typeof value.hq_city === "string" ? value.hq_city : null,
    hq_state: typeof value.hq_state === "string" ? value.hq_state : null,
    verified: typeof value.verified === "boolean" ? value.verified : null,
  };
}

export function asProfessionalCard(value: unknown): ProfessionalCard | null {
  if (!isRecord(value) || typeof value.user_id !== "string") return null;
  return {
    user_id: value.user_id,
    full_name: typeof value.full_name === "string" ? value.full_name : null,
    job_title: typeof value.job_title === "string" ? value.job_title : null,
    avatar_url: typeof value.avatar_url === "string" ? value.avatar_url : null,
    phone: typeof value.phone === "string" ? value.phone : null,
    email: typeof value.email === "string" ? value.email : null,
    bio: typeof value.bio === "string" ? value.bio : null,
    city: typeof value.city === "string" ? value.city : null,
    state: typeof value.state === "string" ? value.state : null,
    organization: asProfessionalOrg(value.organization),
    connection_status: typeof value.connection_status === "string"
      ? (value.connection_status as ConnectionStatus)
      : undefined,
    connection_id: typeof value.connection_id === "string" ? value.connection_id : null,
    connected_at: typeof value.connected_at === "string" ? value.connected_at : null,
    created_at: typeof value.created_at === "string" ? value.created_at : null,
  };
}

export function asProfessionalCards(value: unknown): ProfessionalCard[] {
  if (!Array.isArray(value)) return [];
  return value.map(asProfessionalCard).filter((row): row is ProfessionalCard => Boolean(row));
}

export function asProfessionalProfile(value: unknown): ProfessionalProfileData | null {
  const card = asProfessionalCard(value);
  if (!card || !isRecord(value)) return null;
  const facilities = Array.isArray(value.facilities)
    ? value.facilities
        .map((row) => {
          if (!isRecord(row) || typeof row.id !== "string" || typeof row.name !== "string") return null;
          return {
            id: row.id,
            name: row.name,
            slug: typeof row.slug === "string" ? row.slug : null,
            city: typeof row.city === "string" ? row.city : null,
            state: typeof row.state === "string" ? row.state : null,
            levels_of_care: Array.isArray(row.levels_of_care)
              ? row.levels_of_care.filter((item): item is string => typeof item === "string")
              : [],
            payers: Array.isArray(row.payers)
              ? row.payers.filter((item): item is string => typeof item === "string")
              : [],
            image_urls: Array.isArray(row.image_urls)
              ? row.image_urls.filter((item): item is string => typeof item === "string")
              : undefined,
            short_description: typeof row.short_description === "string" ? row.short_description : null,
            tagline: typeof row.tagline === "string" ? row.tagline : null,
            description: typeof row.description === "string" ? row.description : null,
          } satisfies ProfessionalFacility;
        })
        .filter((row): row is ProfessionalFacility => Boolean(row))
    : [];
  return { ...card, facilities };
}

/** Counts a BD profile can show without extra tracking tables. */
export function bdProfileMetrics(profile: Pick<ProfessionalProfileData, "facilities">) {
  const payers = new Set<string>();
  const states = new Set<string>();
  for (const facility of profile.facilities) {
    for (const payer of facility.payers) {
      const name = payer.trim();
      if (name) payers.add(name);
    }
    const state = facility.state?.trim();
    if (state) states.add(state.toUpperCase());
  }
  return {
    facilities: profile.facilities.length,
    inNetwork: payers.size,
    states: states.size,
  };
}

export function asPublicReferralContacts(value: unknown): PublicReferralContact[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!isRecord(row) || typeof row.name !== "string") return null;
      return {
        name: row.name,
        title: typeof row.title === "string" ? row.title : null,
        phone: typeof row.phone === "string" ? row.phone : null,
        email: typeof row.email === "string" ? row.email : null,
        avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
        user_id: typeof row.user_id === "string" ? row.user_id : null,
      } satisfies PublicReferralContact;
    })
    .filter((row): row is PublicReferralContact => Boolean(row));
}
