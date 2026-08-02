import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import type { FacilityGridCardData } from "@/components/FacilityGridCard";
import { BANYAN_DEMO, BANYAN_GRID_FACILITIES } from "./banyanDemoData";

export type LandingMockupOrg = {
  id: string;
  name: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  hqCity: string | null;
  hqState: string | null;
  description: string | null;
  tagline: string | null;
  facilityCount: number;
  facilities: FacilityGridCardData[];
};

const PREFERRED_ORGS = ["flyland", "level up", "boca recovery"];
const ROTATION_MS = 5_500;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const PREVIEW_FACILITY_COUNT = 4;

const fallbackOrg: LandingMockupOrg = {
  id: "banyan-demo",
  name: BANYAN_DEMO.orgName,
  logoUrl: BANYAN_DEMO.logo,
  brandColor: BANYAN_DEMO.brandColor,
  accentColor: BANYAN_DEMO.accentColor,
  hqCity: "Gulf Breeze",
  hqState: "FL",
  description:
    "A nationally recognized, Joint Commission-accredited network of treatment centers offering detox, residential, PHP, IOP, and mental health programs across the country.",
  tagline: "Deep roots. Lasting recovery.",
  facilityCount: BANYAN_DEMO.facilityCount,
  facilities: BANYAN_GRID_FACILITIES.slice(0, PREVIEW_FACILITY_COUNT),
};

function safeColor(value: string | null, fallback: string) {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

/** Only accept absolute HTTPS image URLs supplied by organization records. */
function safeLogoUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function priority(org: LandingMockupOrg) {
  const name = org.name.toLowerCase();
  const index = PREFERRED_ORGS.findIndex((term) => name.includes(term));
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function orgImageUrls(org: LandingMockupOrg) {
  const urls = [org.logoUrl];
  for (const facility of org.facilities.slice(0, PREVIEW_FACILITY_COUNT)) {
    const image = facility.image_urls?.[0];
    if (image) urls.push(image);
  }
  return urls;
}

function preloadImages(urls: string[]) {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  );
}

/**
 * Reads only public branding fields for the landing-page preview. The mockup
 * remains usable without a network connection by falling back to Banyan.
 */
export function useRotatingMockupOrg(active = true) {
  const [organizations, setOrganizations] = useState<LandingMockupOrg[]>([fallbackOrg]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const organizationsRef = useRef(organizations);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    organizationsRef.current = organizations;
  }, [organizations]);

  useEffect(() => {
    if (!supabaseConfigured) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url, brand_color, accent_color, hq_city, hq_state, description, tagline, num_facilities")
        .not("logo_url", "is", null);

      if (cancelled || error || !data) return;

      const featured = data
        .map((org): LandingMockupOrg | null => {
          const logoUrl = safeLogoUrl(org.logo_url);
          if (!logoUrl) return null;

          return {
            id: org.id,
            name: org.name,
            logoUrl,
            brandColor: safeColor(org.brand_color, fallbackOrg.brandColor),
            accentColor: safeColor(org.accent_color, fallbackOrg.accentColor),
            hqCity: org.hq_city,
            hqState: org.hq_state,
            description: org.description,
            tagline: org.tagline,
            facilityCount: org.num_facilities ?? fallbackOrg.facilityCount,
            facilities: [],
          };
        })
        .filter((org): org is LandingMockupOrg => org !== null)
        .filter((org) => priority(org) !== Number.MAX_SAFE_INTEGER)
        .sort((a, b) => priority(a) - priority(b));

      if (featured.length === 0) return;

      const { data: facilities, error: facilitiesError } = await supabase
        .from("facilities")
        .select("id, organization_id, name, city, state, image_urls, levels_of_care")
        .in("organization_id", featured.map((org) => org.id))
        .eq("hidden_from_org_page", false)
        .order("name");

      if (cancelled || facilitiesError || !facilities) return;

      const facilitiesByOrg = new Map<string, FacilityGridCardData[]>();
      for (const facility of facilities) {
        const cards = facilitiesByOrg.get(facility.organization_id) ?? [];
        if (cards.length >= PREVIEW_FACILITY_COUNT) continue;

        const firstImage =
          (facility.image_urls ?? [])
            .map((url) => safeLogoUrl(url))
            .find((url): url is string => !!url) ?? null;
        cards.push({
          id: facility.id,
          name: facility.name,
          city: facility.city,
          state: facility.state,
          image_urls: firstImage ? [firstImage] : [],
          levels_of_care: (facility.levels_of_care ?? []).slice(0, 3),
        });
        facilitiesByOrg.set(facility.organization_id, cards);
      }

      const completeFeatured = featured
        .map((org) => {
          const orgFacilities = facilitiesByOrg.get(org.id) ?? [];
          return {
            ...org,
            facilities: orgFacilities,
            facilityCount: Math.max(org.facilityCount, orgFacilities.length),
          };
        })
        .filter((org) => org.facilities.length > 0);

      if (completeFeatured.length > 0) {
        const nextOrgs = [...completeFeatured, fallbackOrg];
        await preloadImages(orgImageUrls(nextOrgs[0]));
        if (!cancelled) {
          setOrganizations(nextOrgs);
          setIndex(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active || organizations.length < 2) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let cancelled = false;
    let timer = 0;

    const schedule = () => {
      timer = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          const orgs = organizationsRef.current;
          const next = (indexRef.current + 1) % orgs.length;
          await preloadImages(orgImageUrls(orgs[next]));
          if (cancelled) return;
          setIndex(next);
          schedule();
        })();
      }, ROTATION_MS);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, organizations.length]);

  return useMemo(
    () => organizations[index] ?? organizations[0] ?? fallbackOrg,
    [index, organizations],
  );
}

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
