import { ReactNode } from "react";
import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import {
  facilityGridDensityForCount,
  FacilityGridDensity,
} from "@/components/FacilityGridCard";
import { cn } from "@/lib/utils";

interface Props {
  facilities: ShowcaseFacility[];
  orgSlug?: string | null;
  /** Contact / claim card — sits in the first row beside facilities on lg+. */
  aside?: ReactNode;
}

/** How many facility cards share the first row with the contact aside. */
function topRowFacilityCount(total: number): number {
  if (total <= 0) return 0;
  if (total === 1) return 1; // [facility | contact]
  if (total === 2) return 2; // [f | f | contact]
  // Several facilities: leave a column for contact so the top row balances
  if (total <= 5) return Math.min(2, total); // 3-col: 2 facilities + contact
  return 3; // 4-col: 3 facilities + contact
}

function gridClassForAside(facilityCount: number): string {
  if (facilityCount <= 0) return "grid grid-cols-1 gap-3 sm:gap-5";
  if (facilityCount === 1) {
    return "grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5";
  }
  if (facilityCount === 2) {
    return "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5";
  }
  if (facilityCount <= 5) {
    return "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
  }
  return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";
}

function densityForAsideLayout(count: number): FacilityGridDensity {
  // Contact occupies a column, so treat visual density like count + 1
  return facilityGridDensityForCount(count + 1);
}

export function OrgFacilityRail({ facilities, orgSlug, aside }: Props) {
  const count = facilities.length;

  if (!aside) {
    const density = facilityGridDensityForCount(count);
    const layout = count === 1 ? "split" : "stack";
    const gridClass =
      count === 1
        ? "grid grid-cols-1 gap-3 sm:gap-5"
        : count === 2
          ? "grid grid-cols-2 gap-3 sm:gap-5"
          : count === 3
            ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
            : count <= 5
              ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";

    return (
      <div className={gridClass}>
        {facilities.map((f) => (
          <OrgFacilityShowcaseCard
            key={f.id}
            facility={f}
            orgSlug={orgSlug}
            density={density}
            layout={layout}
          />
        ))}
      </div>
    );
  }

  const density = densityForAsideLayout(count);
  const topCount = topRowFacilityCount(count);
  const topFacilities = facilities.slice(0, topCount);
  const restFacilities = facilities.slice(topCount);

  return (
    <div className={cn(gridClassForAside(count), "items-stretch")}>
      {topFacilities.map((f) => (
        <OrgFacilityShowcaseCard
          key={f.id}
          facility={f}
          orgSlug={orgSlug}
          density={density}
          layout="stack"
        />
      ))}

      <div
        id="org-contact"
        className="min-w-0 h-full hidden lg:block"
      >
        <div className="h-full">{aside}</div>
      </div>

      {restFacilities.map((f) => (
        <OrgFacilityShowcaseCard
          key={f.id}
          facility={f}
          orgSlug={orgSlug}
          density={density}
          layout="stack"
        />
      ))}
    </div>
  );
}
