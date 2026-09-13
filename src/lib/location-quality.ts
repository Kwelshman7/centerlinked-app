export type LocationGap =
  | "street"
  | "city"
  | "state"
  | "zip"
  | "phone"
  | "website"
  | "gallery";

export interface LocationFields {
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  website?: string | null;
  image_urls?: string[] | null;
}

export const KNOWN_DISTINCT_IDENTITY_PAIRS: Array<{ ids: [string, string]; label: string }> = [
  {
    ids: ["50d6c033-0ccc-402d-b9a6-a80ca58e1f54", "d9887265-70e3-4970-94ef-981adb594161"],
    label: "Serenity at Summit NJ and MA are separate locations — do not merge",
  },
  {
    ids: ["984f09e7-e347-4749-9d56-e0517b8ed45d", "13603576-48a6-47ee-9b9e-2c031ebd4513"],
    label: "Journey Pure TN and KY are separate locations — do not merge",
  },
  {
    ids: ["f7f5db61-e91a-4eb6-b0f3-dac65998a091", "bb47aec9-db09-473c-821d-31b970d15290"],
    label: "Harmony Oaks and Summit of Harmony Oaks share a campus address — do not merge",
  },
];

export function blank(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function isCompleteUsZip(value: string | null | undefined): boolean {
  const zip = (value ?? "").trim();
  return /^\d{5}(?:-\d{4})?$/.test(zip);
}

export function locationGaps(fields: LocationFields | null | undefined): LocationGap[] {
  const gaps: LocationGap[] = [];
  if (blank(fields?.address_line1)) gaps.push("street");
  if (blank(fields?.city)) gaps.push("city");
  if (blank(fields?.state)) gaps.push("state");
  if (!isCompleteUsZip(fields?.zip)) gaps.push("zip");
  if (blank(fields?.phone)) gaps.push("phone");
  if (blank(fields?.website)) gaps.push("website");
  if (!fields?.image_urls?.some((url) => url?.trim())) gaps.push("gallery");
  return gaps;
}

export function normalizeNameKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeStreetKey(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function knownDistinctLabel(idA: string, idB: string): string | null {
  const key = pairKey(idA, idB);
  return (
    KNOWN_DISTINCT_IDENTITY_PAIRS.find((pair) => pairKey(pair.ids[0], pair.ids[1]) === key)?.label ??
    null
  );
}

export function groupDuplicateNames<T extends { id: string; name: string }>(rows: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = normalizeNameKey(row.name);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

export function groupDuplicateStreets<
  T extends { id: string; address_line1?: string | null; city?: string | null; state?: string | null },
>(rows: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const street = normalizeStreetKey(row.address_line1);
    if (!street) continue;
    const key = [street, normalizeNameKey(row.city), (row.state ?? "").trim().toUpperCase()].join("|");
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
