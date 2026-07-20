import generated from "./banyanFacilities.generated.json";
import logoBanyan from "@/assets/logo-banyan.png";
import banyanCover from "@/assets/banyan-cover.jpg";
import type { FacilityGridCardData } from "@/components/FacilityGridCard";
import { stateDisplayName } from "@/lib/us-states";

const { org, states, facilities } = generated;

export const BANYAN_DEMO = {
  orgName: org.name,
  orgSlug: org.slug,
  hqLabel: [org.hqCity, org.hqState].filter(Boolean).join(", "),
  brandColor: org.brandColor,
  accentColor: org.accentColor,
  logo: logoBanyan,
  cover: banyanCover,
  userName: org.bdContactName?.split(" ")[0] ?? "Chris",
  userFullName: org.bdContactName ?? "Chris Kaufteil",
  userEmail: org.bdContactEmail ?? "ckaufteil@banyancenters.com",
  userInitials:
    org.bdContactName
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "CK",
  userTitle: "Director of Business Development",
  facilityCount: org.facilityCount,
  teamCount: 8,
  themePrimary: org.brandColor,
  /** Black accent from org record is too harsh in the mini preview gradient. */
  themeSecondary: "#E8F7EB",
  engagementTotal: 83,
  pageViews: 312,
  calls: 24,
  texts: 18,
  emails: 41,
} as const;

export const BANYAN_STATE_CODES = states as string[];

export const BANYAN_STATE_FILTERS = [
  "All Locations",
  ...BANYAN_STATE_CODES.map((code) => stateDisplayName(code)),
];

export function toGridFacility(
  f: (typeof facilities)[number],
): FacilityGridCardData {
  return {
    id: f.id,
    name: f.name,
    city: f.city,
    state: f.state,
    image_urls: f.imageUrl ? [f.imageUrl] : [],
    levels_of_care: f.levelsOfCare,
    short_description: f.description?.split("\n")[0] ?? null,
  };
}

export const BANYAN_GRID_FACILITIES: FacilityGridCardData[] = facilities.map(toGridFacility);

/** Demo click target — Banyan Boca. */
export const FEATURED_FACILITY_INDEX = facilities.findIndex((f) => f.slug.startsWith("banyan-boca"));

const featured = facilities[FEATURED_FACILITY_INDEX >= 0 ? FEATURED_FACILITY_INDEX : 1];

export const FEATURED_FACILITY = {
  id: featured.id,
  name: featured.name,
  slug: featured.slug,
  location: [featured.city, featured.state].filter(Boolean).join(", "),
  description: featured.description?.split("\n")[0] ?? featured.description ?? "",
  facilityType: featured.levelsOfCare[0] ?? "Residential",
  founded: "2014",
  accreditation: "Joint Commission",
  lastUpdated: "2 days ago",
  payers: ["Aetna PPO", "Cigna PPO", "BCBS of FL", "United Healthcare", "Magellan"],
  levels: featured.levelsOfCare.slice(0, 4),
  features: [
    "24/7 clinical support",
    "Dual-diagnosis capable",
    "Co-occurring disorder care",
    "Family programming",
  ],
  treat: ["Substance Use", "Co-Occurring", "Mental Health"],
  gallery: [
    featured.imageUrl ?? banyanCover,
    facilities[0]?.imageUrl,
    facilities[2]?.imageUrl,
  ].filter(Boolean) as string[],
} as const;

/** @deprecated Use BANYAN_GRID_FACILITIES — kept for imports that expect the old shape. */
export const DEMO_FACILITIES = facilities.map((f) => ({
  name: f.name,
  loc: [f.city, f.state].filter(Boolean).join(", "),
  slug: f.slug,
  image: f.imageUrl ?? banyanCover,
  levels: f.levelsOfCare.slice(0, 3),
}));
