import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import {
  FacilityGridCard,
  FacilityGridDensity,
} from "@/components/FacilityGridCard";
import { Button } from "@/components/ui/button";
import { programPublicPath } from "@/lib/public-urls";
import { cn } from "@/lib/utils";

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
  hidden_from_org_page?: boolean;
}

interface Props {
  facility: ShowcaseFacility;
  orgSlug?: string | null;
  density?: FacilityGridDensity;
  layout?: "stack" | "split";
  /** Org admins can hide/show facilities on the public org page. */
  canManage?: boolean;
  onToggleHidden?: (facilityId: string, hidden: boolean) => Promise<void> | void;
}

/** Public org sheet facility card — density adapts to how many facilities the org has. */
export function OrgFacilityShowcaseCard({
  facility: f,
  orgSlug,
  density = "compact",
  layout = "stack",
  canManage = false,
  onToggleHidden,
}: Props) {
  const href = f.slug ? programPublicPath(f.slug, orgSlug) : null;
  const hidden = !!f.hidden_from_org_page;
  const [saving, setSaving] = useState(false);

  const handleToggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onToggleHidden || saving) return;
    setSaving(true);
    try {
      await onToggleHidden(f.id, !hidden);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("relative h-full", hidden && "opacity-70")}>
      {canManage && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {hidden && (
            <span className="rounded-md bg-background/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm ring-1 ring-border/70">
              Hidden
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 px-2.5 text-xs font-semibold shadow-sm"
            onClick={handleToggle}
            disabled={saving}
            aria-label={hidden ? `Show ${f.name} on org page` : `Hide ${f.name} from org page`}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hidden ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {hidden ? "Show" : "Hide"}
          </Button>
        </div>
      )}
      <FacilityGridCard facility={f} href={href} density={density} layout={layout} />
    </div>
  );
}
