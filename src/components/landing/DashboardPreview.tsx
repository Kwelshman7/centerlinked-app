/**
 * Mobile mock of the real org dashboard (/app/dashboard → OrgDashboard).
 * Uses live Banyan Treatment Centers data and the same facility grid as the real app.
 */
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { BANYAN_DEMO } from "./banyanDemoData";
import { BanyanDashboardPreviewBody } from "./BanyanDashboardPreviewBody";

export function DashboardPreviewContent({
  highlightFacilityIndex = null,
}: {
  highlightFacilityIndex?: number | null;
  /** @deprecated Demo mode always shows the full Banyan dashboard grid. */
  demo?: boolean;
} = {}) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground select-none">
      <div className="px-3 pt-2 pb-2 border-b border-border/60 shrink-0 flex items-center justify-between gap-2 min-w-0">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-3.5 w-auto max-w-[55%] object-contain object-left"
          draggable={false}
        />
        <div className="h-6 w-6 rounded-md bg-white border border-border overflow-hidden p-0.5 shrink-0">
          <img
            src={BANYAN_DEMO.logo}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <BanyanDashboardPreviewBody
          highlightFacilityIndex={highlightFacilityIndex}
          density="mobile"
        />
      </div>
    </div>
  );
}
