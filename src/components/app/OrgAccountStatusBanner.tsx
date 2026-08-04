import { Ban, Archive } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Shown when the member's organization is suspended (read-only). */
export function OrgAccountStatusBanner() {
  const { isOrgSuspended, isSuperAdmin } = useAuth();

  if (isSuperAdmin || !isOrgSuspended) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5">
      <Ban className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Organization suspended</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your public referral pages are offline and edits are locked. Contact CenterLinked support
          or complete monthly contract verification to restore access.
        </p>
      </div>
    </div>
  );
}

export function OrgArchivedBlocked() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-8 text-center">
      <div className="max-w-md space-y-3">
        <Archive className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="font-heading text-2xl font-bold">Organization archived</h1>
        <p className="text-sm text-muted-foreground">
          This organization has been archived and is no longer accessible. Contact CenterLinked
          support if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
