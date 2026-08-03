/**
 * Fictional landing-page demo org — Northbend Recovery.
 * Kept fully static so marketing mocks never pull live customer profiles.
 */
import type { CSSProperties } from "react";
import logoNorthbend from "@/assets/logo-northbend.png";
import northbendCover from "@/assets/northbend-cover.jpg";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";
import type { FacilityGridCardData } from "@/components/FacilityGridCard";

export const DEMO_ORG = {
  id: "northbend-demo",
  orgName: "Northbend Recovery",
  orgSlug: "northbend-recovery",
  hqLabel: "Asheville, NC",
  hqCity: "Asheville",
  hqState: "NC",
  brandColor: "#0E7490",
  accentColor: "#14B8A6",
  logo: logoNorthbend,
  cover: northbendCover,
  tagline: "Clear next steps. Lasting recovery.",
  description:
    "A Joint Commission–accredited continuum of care offering detox, residential, PHP, and IOP for substance use and co-occurring mental health — built for referral partners who need answers fast.",
  /** Demo-only identity — never surface real BD contact details on the landing page. */
  userName: "Elena",
  userFullName: "Elena M.",
  userEmail: "elena@northbend.example",
  userPhone: "(555) 014-2290",
  userInitials: "EM",
  userTitle: "Director of Business Development",
  facilityCount: 4,
  teamCount: 6,
  themePrimary: "#0E7490",
  themeSecondary: "#E6F7F8",
  engagementTotal: 83,
  pageViews: 312,
  calls: 24,
  texts: 18,
  emails: 41,
} as const;

/** Featured facility for facility-page and dashboard click demos. */
export const FEATURED_FACILITY = {
  id: "summit-grove",
  name: "Summit Grove Recovery",
  slug: "summit-grove-recovery",
  location: "Asheville, NC",
  city: "Asheville",
  state: "NC",
  description:
    "A full continuum campus with 24/7 clinical support and a clear handoff path for referral partners who need answers fast.",
  facilityType: "Treatment Center",
  founded: "2016",
  accreditation: "Joint Commission",
  lastUpdated: "2 days ago",
  payers: ["Aetna PPO", "Cigna PPO", "BCBS of NC", "United Healthcare", "Magellan"],
  levels: ["Detox", "Residential", "PHP", "IOP"],
  features: [
    "24/7 nursing support",
    "Dual-diagnosis capable",
    "Private & semi-private rooms",
    "Family programming",
  ],
  treat: ["Substance Use", "Co-Occurring", "Mental Health"],
  gallery: [facility1, facility2, facility3],
} as const;

export const FEATURED_FACILITY_INDEX = 0;

/** Multiple locations under one Northbend brand for realistic org/dashboard grids. */
export const DEMO_GRID_FACILITIES: FacilityGridCardData[] = [
  {
    id: FEATURED_FACILITY.id,
    name: FEATURED_FACILITY.name,
    city: FEATURED_FACILITY.city,
    state: FEATURED_FACILITY.state,
    image_urls: [facility1],
    levels_of_care: ["Detox", "Residential"],
    short_description: FEATURED_FACILITY.description,
  },
  {
    id: "cedar-hollow",
    name: "Cedar Hollow Wellness",
    city: "Black Mountain",
    state: "NC",
    image_urls: [facility2],
    levels_of_care: ["Residential", "PHP"],
    short_description:
      "Structured dual-diagnosis programming with family involvement in a quiet mountain setting.",
  },
  {
    id: "laurel-peak",
    name: "Laurel Peak Recovery",
    city: "Hendersonville",
    state: "NC",
    image_urls: [facility3],
    levels_of_care: ["PHP", "IOP", "OP"],
    short_description:
      "Flexible day and intensive outpatient care for step-down support and ongoing recovery.",
  },
  {
    id: "riverstone",
    name: "Riverstone Healing Center",
    city: "Weaverville",
    state: "NC",
    image_urls: [northbendCover],
    levels_of_care: ["Residential", "PHP"],
    short_description:
      "A private campus for clients who need immersive care and a calm path back to daily life.",
  },
];

export const DEMO_STATE_CODES = ["NC"] as const;

export const DEMO_STATE_FILTERS = ["All Locations", "North Carolina"] as const;

/** @deprecated Prefer DEMO_GRID_FACILITIES — kept for older preview imports. */
export const DEMO_FACILITIES = DEMO_GRID_FACILITIES.map((f) => ({
  name: f.name,
  loc: [f.city, f.state].filter(Boolean).join(", "),
  slug:
    f.id === FEATURED_FACILITY.id
      ? FEATURED_FACILITY.slug
      : f.id.replace(/_/g, "-"),
  image: f.image_urls?.[0] ?? DEMO_ORG.cover,
  levels: (f.levels_of_care ?? []).slice(0, 3),
}));

function rgbToHsl(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return `0 0% ${Math.round(lightness * 100)}%`;

  const difference = max - min;
  const saturation = difference / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === red) hue = ((green - blue) / difference) % 6;
  else if (max === green) hue = (blue - red) / difference + 2;
  else hue = (red - green) / difference + 4;

  return `${Math.round(hue * 60 + (hue < 0 ? 360 : 0))} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

/** Tailwind's semantic primary colors expect HSL channels, not a hex value. */
export function mockupThemeVariables(brandColor: string) {
  return {
    "--primary": rgbToHsl(brandColor),
    "--primary-foreground": "0 0% 100%",
    "--ring": rgbToHsl(brandColor),
  } as CSSProperties;
}
