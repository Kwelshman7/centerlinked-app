import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import {
  FacilityGrid,
  facilityGridDensityForCount,
} from "@/components/FacilityGridCard";

interface Props {
  facilities: ShowcaseFacility[];
  orgSlug?: string | null;
}

export function OrgFacilityRail({ facilities, orgSlug }: Props) {
  const count = facilities.length;
  const density = facilityGridDensityForCount(count);
  const layout = count === 1 ? "split" : "stack";

  return (
    <FacilityGrid count={count}>
      {facilities.map((f) => (
        <OrgFacilityShowcaseCard
          key={f.id}
          facility={f}
          orgSlug={orgSlug}
          density={density}
          layout={layout}
        />
      ))}
    </FacilityGrid>
  );
}
