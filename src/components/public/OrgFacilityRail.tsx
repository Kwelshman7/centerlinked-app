import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import {
  facilityGridDensityForCount,
  FacilityGridDensity,
} from "@/components/FacilityGridCard";

interface Props {
  facilities: ShowcaseFacility[];
  orgSlug?: string | null;
  canManage?: boolean;
  onToggleHidden?: (facilityId: string, hidden: boolean) => Promise<void> | void;
}

/**
 * Full-width adaptive facility grid.
 * Column count and card density scale with how many facilities are shown so
 * small orgs (1–2) fill the page without large empty gaps, while larger orgs
 * use denser multi-column layouts.
 */
function gridClassForCount(count: number): string {
  if (count <= 0) return "grid grid-cols-1 gap-3 sm:gap-5";
  if (count === 1) return "grid grid-cols-1 gap-3 sm:gap-5";
  if (count === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5";
  if (count === 3) return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5";
  if (count === 4) return "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";
  if (count <= 6) return "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
  return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";
}

function layoutForCount(count: number): "stack" | "split" {
  return count === 1 ? "split" : "stack";
}

function densityForCount(count: number): FacilityGridDensity {
  return facilityGridDensityForCount(count);
}

export function OrgFacilityRail({
  facilities,
  orgSlug,
  canManage = false,
  onToggleHidden,
}: Props) {
  const count = facilities.length;
  const density = densityForCount(count);
  const layout = layoutForCount(count);

  return (
    <div className={gridClassForCount(count)}>
      {facilities.map((f) => (
        <OrgFacilityShowcaseCard
          key={f.id}
          facility={f}
          orgSlug={orgSlug}
          density={density}
          layout={layout}
          canManage={canManage}
          onToggleHidden={onToggleHidden}
        />
      ))}
    </div>
  );
}
