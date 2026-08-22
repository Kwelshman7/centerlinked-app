import type { OrgSheetData } from "@/components/public/OrganizationSheetView";
import type { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { contrastingTextColor } from "@/lib/color-contrast";
import { categorizeFacilityTags } from "@/lib/facility-program-tags";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { DEFAULT_ACCENT, parseAccentColor, parseBrandColor } from "@/lib/public-urls";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import {
  layoutForFacilityCount,
  payerSetsAreShared,
  referralOverviewFilename,
  shortenLevelOfCare,
  uniquePreserve,
  type OrgOnePagerLayout,
} from "@/lib/org-one-pager-layout";

export type { OrgOnePagerLayout };
export { layoutForFacilityCount, shortenLevelOfCare };

export type OrgOnePagerTheme = {
  brand: string;
  accent: string;
  onBrand: string;
  mutedOnBrand: string;
  paper: string;
  ink: string;
  muted: string;
  rule: string;
  tint: string;
};

export type OrgOnePagerFacility = {
  id: string;
  name: string;
  cityState: string | null;
  address: string | null;
  tagline: string | null;
  summary: string | null;
  photoUrl: string | null;
  levels: string[];
  whoWeTreat: string[];
  specialties: string[];
  payers: string[];
  payerOverflow: number;
};

export type OrgOnePagerContact = {
  name: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

export type OrgOnePagerModel = {
  layout: OrgOnePagerLayout;
  theme: OrgOnePagerTheme;
  orgName: string;
  tagline: string | null;
  overview: string | null;
  locationContext: string | null;
  facilityCount: number;
  facilityOverflow: number;
  logoUrl: string | null;
  facilities: OrgOnePagerFacility[];
  sharedPayers: string[] | null;
  sharedPayerOverflow: number;
  contact: OrgOnePagerContact;
  profileUrl: string | null;
  profileLabel: string | null;
  filename: string;
  createdAt: Date;
};

type BuildInput = {
  org: OrgSheetData;
  facilities: ShowcaseFacility[];
  facilityPayersById: Map<string, string[]> | Record<string, string[]>;
  brandColor?: string;
  profileUrl?: string | null;
  createdAt?: Date;
};

const WHO_PRIORITY = [
  "Women",
  "Men",
  "Adolescents",
  "Young Adults",
  "Adults (18+)",
  "Adults",
  "Professionals",
  "First Responders",
  "Veterans",
  "LGBTQ+",
  "Dual Diagnosis",
];

function payersFrom(
  source: Map<string, string[]> | Record<string, string[]>,
  facilityId: string,
): string[] {
  if (source instanceof Map) return (source.get(facilityId) ?? []).filter(Boolean);
  return (source[facilityId] ?? []).filter(Boolean);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function brandRgba(hex: string, alpha: number, fallback = "rgba(26,115,232,0.12)"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

export function resolveOrgOnePagerTheme(brandColor?: string | null, accentColor?: string | null): OrgOnePagerTheme {
  const brand = parseBrandColor(brandColor);
  const accent = parseAccentColor(accentColor) || DEFAULT_ACCENT;
  const onBrand = contrastingTextColor(brand);
  return {
    brand,
    accent,
    onBrand,
    mutedOnBrand: onBrand === "#ffffff" ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.7)",
    paper: "#f7f5f1",
    ink: "#1a2332",
    muted: "#5c6778",
    rule: brandRgba(brand, 0.18),
    tint: brandRgba(brand, 0.08),
  };
}

function condenseText(value: string | null | undefined, max: number): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length <= max) return text;
  const slice = text.slice(0, Math.max(0, max - 1));
  const cut = slice.lastIndexOf(" ");
  return `${(cut > 40 ? slice.slice(0, cut) : slice).trimEnd()}…`;
}

function displayWebsite(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function cityStateLine(facility: ShowcaseFacility): string | null {
  const city = facility.city?.trim() || null;
  const state = facility.state?.trim() ? stateDisplayName(facility.state) : null;
  const line = [city, state].filter(Boolean).join(", ");
  return line || null;
}

function addressLine(facility: ShowcaseFacility): string | null {
  const street = facility.address_line1?.trim() || null;
  const zip = facility.zip?.trim() || null;
  const parts = [street, zip].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function locationContext(org: OrgSheetData, facilities: ShowcaseFacility[]): string | null {
  const states = uniquePreserve(
    facilities.map((f) => (f.state ? stateDisplayName(f.state) : "")).filter(Boolean),
  );
  const cities = uniquePreserve(facilities.map((f) => f.city?.trim() || "").filter(Boolean));
  const countLabel =
    facilities.length === 1 ? "1 location" : `${facilities.length} locations`;

  if (states.length === 1 && cities.length === 1) {
    return `${cities[0]}, ${states[0]} · ${countLabel}`;
  }
  if (states.length === 1) {
    const hq = [org.hq_city?.trim(), org.hq_state ? stateDisplayName(org.hq_state) : null]
      .filter(Boolean)
      .join(", ");
    return hq && resolveStateCode(org.hq_state) === resolveStateCode(states[0])
      ? `${hq} · ${countLabel}`
      : `${states[0]} · ${countLabel}`;
  }
  if (states.length > 1) {
    return `${states.slice(0, 3).join(" · ")}${states.length > 3 ? "…" : ""} · ${countLabel}`;
  }
  const hq = [org.hq_city?.trim(), org.hq_state ? stateDisplayName(org.hq_state) : null]
    .filter(Boolean)
    .join(", ");
  return hq ? `${hq} · ${countLabel}` : countLabel;
}

function pickWhoWeTreat(tags: string[], max: number): string[] {
  const unique = uniquePreserve(tags);
  const hasWomen = unique.some((t) => t.toLowerCase() === "women");
  const hasMen = unique.some((t) => t.toLowerCase() === "men");
  // Co-ed programs: gender labels add noise; keep more specific populations.
  const filtered =
    hasWomen && hasMen
      ? unique.filter((t) => !["women", "men"].includes(t.toLowerCase()))
      : unique;
  const ranked = [...filtered].sort((a, b) => {
    const ai = WHO_PRIORITY.findIndex((p) => p.toLowerCase() === a.toLowerCase());
    const bi = WHO_PRIORITY.findIndex((p) => p.toLowerCase() === b.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return ranked.slice(0, max);
}

function payerCaps(layout: OrgOnePagerLayout): { perFacility: number; shared: number } {
  switch (layout) {
    case "feature":
      return { perFacility: 18, shared: 18 };
    case "split":
      return { perFacility: 8, shared: 14 };
    case "trio":
      return { perFacility: 6, shared: 12 };
    case "grid":
      return { perFacility: 4, shared: 10 };
    default:
      return { perFacility: 3, shared: 8 };
  }
}

function visibleCount(layout: OrgOnePagerLayout, total: number): number {
  if (layout === "rows") return Math.min(total, 10);
  if (layout === "grid") return Math.min(total, 6);
  return total;
}

export function buildOrgOnePagerModel(input: BuildInput): OrgOnePagerModel {
  const visible = input.facilities.filter((f) => !f.hidden_from_org_page);
  const layout = layoutForFacilityCount(visible.length);
  const shown = visible.slice(0, visibleCount(layout, visible.length));
  const caps = payerCaps(layout);
  const theme = resolveOrgOnePagerTheme(input.brandColor ?? input.org.brand_color, input.org.accent_color);

  const levelMax = layout === "feature" ? 8 : layout === "split" ? 6 : layout === "trio" ? 5 : layout === "grid" ? 4 : 3;
  const whoMax = layout === "feature" ? 6 : layout === "rows" ? 2 : 4;
  const specialtyMax = layout === "feature" ? 6 : layout === "split" ? 4 : layout === "trio" ? 3 : 0;
  const summaryMax = layout === "feature" ? 280 : layout === "split" ? 140 : layout === "trio" ? 90 : 0;
  const overviewMax = layout === "rows" ? 0 : layout === "grid" ? 160 : 220;

  const mapped: OrgOnePagerFacility[] = shown.map((facility) => {
    const tags = categorizeFacilityTags(facility);
    const allPayers = uniquePreserve(payersFrom(input.facilityPayersById, facility.id));
    const payers = allPayers.slice(0, caps.perFacility);
    return {
      id: facility.id,
      name: facility.name,
      cityState: cityStateLine(facility),
      address: addressLine(facility),
      tagline: condenseText(facility.tagline, layout === "feature" ? 90 : 48),
      summary: condenseText(
        facility.short_description || facility.description,
        summaryMax,
      ),
      photoUrl: facility.image_urls?.[0] ?? null,
      levels: uniquePreserve((facility.levels_of_care ?? []).map(shortenLevelOfCare)).slice(0, levelMax),
      whoWeTreat: pickWhoWeTreat(
        [...tags.whoWeTreat, ...(tags.conditions.includes("Dual Diagnosis") ? ["Dual Diagnosis"] : [])],
        whoMax,
      ),
      specialties: uniquePreserve([...tags.therapies, ...tags.conditions]).slice(0, specialtyMax),
      payers,
      payerOverflow: Math.max(0, allPayers.length - payers.length),
    };
  });

  const payerSets = shown.map((f) => uniquePreserve(payersFrom(input.facilityPayersById, f.id)));
  const sharedAll = payerSetsAreShared(payerSets) ? payerSets[0] : null;
  const sharedPayers = sharedAll ? sharedAll.slice(0, caps.shared) : null;

  if (sharedPayers) {
    for (const facility of mapped) {
      facility.payers = [];
      facility.payerOverflow = 0;
    }
  }

  const showPhotos = layout === "feature" || layout === "split" || layout === "trio";
  if (!showPhotos) {
    for (const facility of mapped) facility.photoUrl = null;
  }

  const orgPhone = formatPhoneDisplay(input.org.bd_contact_phone);
  const contact: OrgOnePagerContact = {
    name: input.org.bd_contact_name?.trim() || null,
    title: input.org.bd_contact_name?.trim() ? "Business Development" : null,
    phone: sanitizePhone(input.org.bd_contact_phone) ? orgPhone : null,
    email: input.org.bd_contact_email?.trim() || null,
    website: displayWebsite(input.org.website),
  };

  const profileUrl = input.profileUrl?.trim() || null;
  let profileLabel: string | null = null;
  if (profileUrl) {
    try {
      profileLabel = new URL(profileUrl).host.replace(/^www\./, "") + new URL(profileUrl).pathname;
    } catch {
      profileLabel = profileUrl.replace(/^https?:\/\//i, "");
    }
  }

  return {
    layout,
    theme,
    orgName: input.org.name,
    tagline: condenseText(input.org.tagline, 90),
    overview: condenseText(input.org.description, overviewMax),
    locationContext: locationContext(input.org, visible),
    facilityCount: visible.length,
    facilityOverflow: Math.max(0, visible.length - mapped.length),
    logoUrl: input.org.logo_url,
    facilities: mapped,
    sharedPayers,
    sharedPayerOverflow: sharedAll ? Math.max(0, sharedAll.length - (sharedPayers?.length ?? 0)) : 0,
    contact,
    profileUrl,
    profileLabel,
    filename: referralOverviewFilename(input.org.name),
    createdAt: input.createdAt ?? new Date(),
  };
}
