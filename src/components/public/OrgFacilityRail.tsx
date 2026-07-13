import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import { FacilityGrid } from "@/components/FacilityGridCard";

interface Props {
  facilities: ShowcaseFacility[];
  orgSlug?: string | null;
}

export function OrgFacilityRail({ facilities, orgSlug }: Props) {
  return (
    <FacilityGrid>
      {facilities.map((f) => (
        <OrgFacilityShowcaseCard key={f.id} facility={f} orgSlug={orgSlug} />
      ))}
    </FacilityGrid>
  );
}
