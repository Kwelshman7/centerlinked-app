import {
  FacilityGridCard,
  FacilityGridDensity,
} from "@/components/FacilityGridCard";
import { programPublicPath } from "@/lib/public-urls";

export interface ShowcaseFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  address_line1?: string | null;
  zip?: string | null;
  image_urls: string[];
  levels_of_care: string[];
  population_served?: string[] | null;
  specializations?: string[] | null;
  highlights?: string[] | null;
  accreditations?: string[] | null;
  short_description: string | null;
  description?: string | null;
  tagline?: string | null;
  insurance_status: string | null;
  featured_payer: string | null;
  updated_at?: string | null;
}

interface Props {
  facility: ShowcaseFacility;
  orgSlug?: string | null;
  density?: FacilityGridDensity;
  layout?: "stack" | "split";
}

/** Public org sheet facility card — density adapts to how many facilities the org has. */
export function OrgFacilityShowcaseCard({
  facility: f,
  orgSlug,
  density = "compact",
  layout = "stack",
}: Props) {
  const href = f.slug ? programPublicPath(f.slug, orgSlug) : null;

  return (
    <FacilityGridCard facility={f} href={href} density={density} layout={layout} />
  );
}
