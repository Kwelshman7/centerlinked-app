import { ClaimOrganizationDialog } from "@/components/ClaimOrganizationDialog";

interface Props {
  organizationId: string;
  organizationName: string;
}

export function OrgClaimCard({ organizationId, organizationName }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/40 p-4 sm:p-5 w-full h-full flex flex-col justify-center text-foreground">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Send a Referral
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        No BD contact set up yet. Claim this profile to add your team and start
        receiving referrals.
      </p>
      <div className="flex justify-center">
        <ClaimOrganizationDialog
          organizationId={organizationId}
          organizationName={organizationName}
        />
      </div>
    </div>
  );
}
