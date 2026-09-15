import { normalizeBdEmail } from "./bd-contact.ts";
import {
  lastNameSortKey,
  type ProfessionalCard,
} from "./professional-network.ts";
import { resolveStateCode } from "./us-states.ts";

export const CONTACT_TYPES = [
  "bd_rep",
  "facility",
  "admissions",
  "insurance",
  "clinical",
  "outreach",
  "executive",
  "other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
export type ContactSource = "connection" | "representative" | "facility";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  bd_rep: "BD Rep",
  facility: "Facility",
  admissions: "Admissions",
  insurance: "Insurance",
  clinical: "Clinical",
  outreach: "Outreach",
  executive: "Executive",
  other: "Other",
};

export interface WorkspaceContactOrg {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
}

export interface WorkspaceContact {
  id: string;
  userId: string | null;
  representativeId: string | null;
  facilityId: string | null;
  fullName: string;
  title: string | null;
  organization: WorkspaceContactOrg | null;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  contactType: ContactType;
  payers: string[];
  connectedAt: string | null;
  notes: string | null;
  source: ContactSource;
  connectionId: string | null;
}

export interface RepresentativeInput {
  id: string;
  user_id?: string | null;
  full_name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  payer_expertise?: string[] | null;
  states_covered?: string[] | null;
  internal_notes?: string | null;
  active?: boolean | null;
}

export interface FacilityBdInput {
  id: string;
  name: string;
  organization_id: string | null;
  city?: string | null;
  state?: string | null;
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  bd_contact_title?: string | null;
  organization?: WorkspaceContactOrg | null;
}

export interface ContactFilters {
  query?: string;
  type?: ContactType | "all";
  state?: string | "all";
  insurance?: string;
}

const SOURCE_RANK: Record<ContactSource, number> = {
  connection: 0,
  representative: 1,
  facility: 2,
};

export function classifyContactType(title: string | null | undefined, source: ContactSource): ContactType {
  const t = (title ?? "").toLowerCase();
  if (/insurance|payer|provider relations|managed care/.test(t)) return "insurance";
  if (/admission/.test(t)) return "admissions";
  if (/clinical|medical director|therapist|psychiatrist|nursing/.test(t)) return "clinical";
  if (/outreach/.test(t)) return "outreach";
  if (/\b(ceo|coo|cfo|cmo|executive|president|founder|owner)\b/.test(t)) return "executive";
  if (/business development|\bbd\b|bd rep|bd representative/.test(t)) return "bd_rep";
  if (source === "facility") return "facility";
  if (source === "representative") return "bd_rep";
  return "other";
}

function clean(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function uniquePayers(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const name = clean(value);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function orgFromCard(person: ProfessionalCard): WorkspaceContactOrg | null {
  if (!person.organization?.id || !person.organization.name) return null;
  return {
    id: person.organization.id,
    name: person.organization.name,
    slug: person.organization.slug ?? null,
    logo_url: person.organization.logo_url ?? null,
  };
}

export function workspaceContactFromConnection(person: ProfessionalCard): WorkspaceContact | null {
  if (!person.user_id) return null;
  const fullName = clean(person.full_name) || "CenterLinked professional";
  const title = clean(person.job_title);
  return {
    id: `user:${person.user_id}`,
    userId: person.user_id,
    representativeId: null,
    facilityId: null,
    fullName,
    title,
    organization: orgFromCard(person),
    avatarUrl: clean(person.avatar_url),
    phone: clean(person.phone),
    email: normalizeBdEmail(person.email),
    city: clean(person.city) || clean(person.organization?.hq_city),
    state: clean(person.state) || clean(person.organization?.hq_state),
    contactType: classifyContactType(title, "connection"),
    payers: [],
    connectedAt: clean(person.connected_at),
    notes: null,
    source: "connection",
    connectionId: clean(person.connection_id),
  };
}

export function workspaceContactFromRepresentative(
  row: RepresentativeInput,
  viewerOrgId: string | null,
): WorkspaceContact | null {
  if (row.active === false) return null;
  const fullName = clean(row.full_name);
  if (!fullName) return null;
  const title = clean(row.title);
  const orgId = clean(row.organization_id);
  const orgName = clean(row.organization_name);
  const ownNotes = orgId && viewerOrgId && orgId === viewerOrgId ? clean(row.internal_notes) : null;
  const state = row.states_covered?.find((item) => clean(item)) ?? null;
  return {
    id: row.user_id ? `user:${row.user_id}` : `rep:${row.id}`,
    userId: clean(row.user_id),
    representativeId: row.id,
    facilityId: null,
    fullName,
    title,
    organization: orgId && orgName ? { id: orgId, name: orgName, slug: null, logo_url: null } : orgName ? { id: orgId || `name:${orgName.toLowerCase()}`, name: orgName, slug: null, logo_url: null } : null,
    avatarUrl: clean(row.avatar_url),
    phone: clean(row.phone),
    email: normalizeBdEmail(row.email),
    city: null,
    state: clean(state),
    contactType: classifyContactType(title, "representative"),
    payers: uniquePayers(row.payer_expertise ?? []),
    connectedAt: null,
    notes: ownNotes,
    source: "representative",
    connectionId: null,
  };
}

export function workspaceContactFromFacility(row: FacilityBdInput): WorkspaceContact | null {
  const fullName = clean(row.bd_contact_name);
  if (!fullName) return null;
  const title = clean(row.bd_contact_title);
  const org = row.organization?.id && row.organization.name ? row.organization : null;
  return {
    id: `facility:${row.id}`,
    userId: null,
    representativeId: null,
    facilityId: row.id,
    fullName,
    title,
    organization: org,
    avatarUrl: null,
    phone: clean(row.bd_contact_phone),
    email: normalizeBdEmail(row.bd_contact_email),
    city: clean(row.city),
    state: clean(row.state),
    contactType: classifyContactType(title, "facility"),
    payers: [],
    connectedAt: null,
    notes: null,
    source: "facility",
    connectionId: null,
  };
}

function identityKeys(contact: WorkspaceContact): string[] {
  const keys: string[] = [];
  if (contact.userId) keys.push(`user:${contact.userId}`);
  if (contact.email) keys.push(`email:${contact.email}`);
  const name = contact.fullName.trim().toLowerCase();
  const orgId = contact.organization?.id;
  if (name && orgId) keys.push(`nameorg:${name}|${orgId}`);
  return keys;
}

function prefer(a: string | null, b: string | null): string | null {
  return a || b;
}

function mergePair(primary: WorkspaceContact, incoming: WorkspaceContact): WorkspaceContact {
  const keepPrimary = SOURCE_RANK[primary.source] <= SOURCE_RANK[incoming.source];
  const base = keepPrimary ? primary : incoming;
  const other = keepPrimary ? incoming : primary;
  return {
    ...base,
    userId: base.userId || other.userId,
    representativeId: base.representativeId || other.representativeId,
    facilityId: base.facilityId || other.facilityId,
    fullName: base.fullName || other.fullName,
    title: prefer(base.title, other.title),
    organization: base.organization || other.organization,
    avatarUrl: prefer(base.avatarUrl, other.avatarUrl),
    phone: prefer(base.phone, other.phone),
    email: prefer(base.email, other.email),
    city: prefer(base.city, other.city),
    state: prefer(base.state, other.state),
    contactType:
      base.contactType !== "other" ? base.contactType : other.contactType,
    payers: uniquePayers([...base.payers, ...other.payers]),
    connectedAt: prefer(base.connectedAt, other.connectedAt),
    notes: prefer(base.notes, other.notes),
    connectionId: prefer(base.connectionId, other.connectionId),
    id: base.userId ? `user:${base.userId}` : base.id,
  };
}

export function mergeWorkspaceContacts(input: {
  connections?: ProfessionalCard[];
  representatives?: RepresentativeInput[];
  facilities?: FacilityBdInput[];
  viewerOrgId?: string | null;
}): WorkspaceContact[] {
  const viewerOrgId = input.viewerOrgId ?? null;
  const incoming: WorkspaceContact[] = [
    ...(input.connections ?? []).map(workspaceContactFromConnection),
    ...(input.representatives ?? []).map((row) => workspaceContactFromRepresentative(row, viewerOrgId)),
    ...(input.facilities ?? []).map(workspaceContactFromFacility),
  ].filter((row): row is WorkspaceContact => Boolean(row));

  const byId = new Map<string, WorkspaceContact>();
  const keyToId = new Map<string, string>();

  for (const contact of incoming) {
    const keys = identityKeys(contact);
    const existingId = keys.map((key) => keyToId.get(key)).find(Boolean);
    if (!existingId) {
      byId.set(contact.id, contact);
      for (const key of keys) keyToId.set(key, contact.id);
      continue;
    }
    const existing = byId.get(existingId);
    if (!existing) continue;
    const merged = mergePair(existing, contact);
    if (merged.id !== existingId) {
      byId.delete(existingId);
      byId.set(merged.id, merged);
      for (const [key, id] of keyToId) {
        if (id === existingId) keyToId.set(key, merged.id);
      }
    } else {
      byId.set(existingId, merged);
    }
    for (const key of identityKeys(merged)) keyToId.set(key, merged.id);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const ka = lastNameSortKey(a.fullName);
    const kb = lastNameSortKey(b.fullName);
    if (ka !== kb) return ka.localeCompare(kb);
    return a.fullName.localeCompare(b.fullName);
  });
}

export function filterWorkspaceContacts(
  contacts: WorkspaceContact[],
  filters: ContactFilters,
): WorkspaceContact[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const type = filters.type && filters.type !== "all" ? filters.type : null;
  const state = filters.state && filters.state !== "all" ? resolveStateCode(filters.state) : null;
  const insurance = filters.insurance?.trim().toLowerCase() ?? "";

  return contacts.filter((contact) => {
    if (type && contact.contactType !== type) return false;
    if (state) {
      const contactState = resolveStateCode(contact.state);
      if (contactState !== state) return false;
    }
    if (insurance) {
      const hay = contact.payers.join(" ").toLowerCase();
      if (!hay.includes(insurance)) return false;
    }
    if (!query) return true;
    const blob = [
      contact.fullName,
      contact.title,
      contact.organization?.name,
      contact.city,
      contact.state,
      contact.email,
      ...contact.payers,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(query);
  });
}

export function contactWorkspaceStats(contacts: WorkspaceContact[]) {
  const orgs = new Set<string>();
  let bdReps = 0;
  let insurance = 0;
  for (const contact of contacts) {
    if (contact.contactType === "bd_rep") bdReps += 1;
    if (contact.contactType === "insurance") insurance += 1;
    if (contact.contactType !== "insurance" && contact.organization?.id) {
      orgs.add(contact.organization.id);
    }
  }
  return {
    total: contacts.length,
    bdReps,
    treatmentCenters: orgs.size,
    insurance,
  };
}

export function uniqueContactStates(contacts: WorkspaceContact[]): string[] {
  const states = new Set<string>();
  for (const contact of contacts) {
    const code = resolveStateCode(contact.state);
    if (code) states.add(code);
  }
  return Array.from(states).sort((a, b) => a.localeCompare(b));
}

export function formatPayerCell(payers: string[]): string {
  if (!payers.length) return "—";
  if (payers.length === 1) return payers[0];
  if (payers.length === 2) return payers.join(", ");
  return "Multiple";
}

export function formatConnectedDate(iso: string | null | undefined): string {
  const value = clean(iso);
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function applyOrgPayers(
  contacts: WorkspaceContact[],
  payersByOrgId: Record<string, string[]>,
): WorkspaceContact[] {
  return contacts.map((contact) => {
    if (contact.payers.length > 0 || !contact.organization?.id) return contact;
    const payers = uniquePayers(payersByOrgId[contact.organization.id] ?? []);
    if (!payers.length) return contact;
    return { ...contact, payers };
  });
}
