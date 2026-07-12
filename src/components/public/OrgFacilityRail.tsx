import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import { ContractRow } from "@/lib/derive-insurance";

interface Props {
  facilities: ShowcaseFacility[];
  contracts: ContractRow[];
  orgSlug?: string | null;
}

export function OrgFacilityRail({ facilities, contracts, orgSlug }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
      {facilities.map((f) => (
        <OrgFacilityShowcaseCard key={f.id} facility={f} contracts={contracts} orgSlug={orgSlug} />
      ))}
    </div>
  );
}
