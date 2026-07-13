import { FacilityGridCard } from "@/components/FacilityGridCard";
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
}

/** Public org sheet facility card — matches the org dashboard grid card. */
export function OrgFacilityShowcaseCard({ facility: f, orgSlug }: Props) {
  const href = f.slug ? programPublicPath(f.slug, orgSlug) : null;

  return <FacilityGridCard facility={f} href={href} />;
}
