import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Share2,
  Users,
  BarChart3,
  Pencil,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  Palette,
  UserPlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { shareOrCopyUrl } from "@/lib/share";
import { orgPublicPath } from "@/lib/public-urls";
import { resolveStateCode } from "@/lib/us-states";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { AddFacilityDialog } from "@/components/app/facility/AddFacilityDialog";
import { FacilityGrid, FacilityGridCard } from "@/components/FacilityGridCard";
import { extractLogoColor } from "@/lib/extract-logo-color";
import { cn } from "@/lib/utils";

interface OrgRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  brand_color: string | null;
  accent_color: string | null;
}

interface FacilityRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  image_urls: string[] | null;
  levels_of_care: string[] | null;
  updated_at: string;
}

interface Props {
  organizationId: string;
  /** Super-admin setup mode — links point to admin workspace paths. */
  adminMode?: boolean;
  welcomeName?: string;
  onFacilitiesChanged?: () => void;
}

const FACILITIES_PAGE_SIZE = 24; // 4 across × 6 rows
const DEFAULT_BRAND = "#1A73E8";

function uniqueFacilityStates(facilities: FacilityRow[]): string[] {
  const codes = new Set<string>();
  for (const f of facilities) {
    const code = resolveStateCode(f.state);
    if (code) codes.add(code);
  }
  return Array.from(codes).sort();
}

export function OrgDashboard({
  organizationId,
  adminMode = false,
  welcomeName = "there",
  onFacilitiesChanged,
}: Props) {
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [allFacilities, setAllFacilities] = useState<FacilityRow[]>([]);
  const [facilityPage, setFacilityPage] = useState(1);
  const [selectedState, setSelectedState] = useState("all");
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [engagement, setEngagement] = useState<{
    page_views: number;
    call_clicks: number;
    text_clicks: number;
    email_clicks: number;
  } | null>(null);

  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [accentColor, setAccentColor] = useState("#E0EDFF");
  const [logoSuggested, setLogoSuggested] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  const firstName = useMemo(
    () => (welcomeName.includes(" ") ? welcomeName.split(" ")[0] : welcomeName),
    [welcomeName],
  );

  const facilityStates = useMemo(() => uniqueFacilityStates(allFacilities), [allFacilities]);

  const filteredFacilities = useMemo(() => {
    if (selectedState === "all") return allFacilities;
    return allFacilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [allFacilities, selectedState]);

  const filteredCount = filteredFacilities.length;
  const facilityCount = allFacilities.length;
  const totalFacilityPages = Math.max(1, Math.ceil(filteredCount / FACILITIES_PAGE_SIZE));
  const showFacilityPagination = filteredCount > FACILITIES_PAGE_SIZE;

  const pageFacilities = useMemo(() => {
    const from = (facilityPage - 1) * FACILITIES_PAGE_SIZE;
    return filteredFacilities.slice(from, from + FACILITIES_PAGE_SIZE);
  }, [filteredFacilities, facilityPage]);

  const facilitiesHref = adminMode
    ? `/app/admin/organizations/${organizationId}?tab=facilities`
    : facilityCount === 0
      ? "/app/onboarding?add=1"
      : "/app/facilities";

  const brandingHref = adminMode
    ? `/app/admin/organizations/${organizationId}?tab=branding`
    : "/app/settings";

  const membersHref = adminMode ? null : "/app/members";

  const facilityDetailHref = (id: string) => `/app/facilities/${id}`;

  const loadFacilities = useCallback(async () => {
    if (!organizationId) return;
    setFacilitiesLoading(true);
    const { data: f } = await supabase
      .from("facilities")
      .select("id,name,city,state,image_urls,levels_of_care,updated_at")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });
    setAllFacilities((f as FacilityRow[]) ?? []);
    setFacilitiesLoading(false);
  }, [organizationId]);

  /** Reload local list and optionally sync parent (e.g. admin workspace) after a mutation. */
  const reloadFacilities = useCallback(async () => {
    await loadFacilities();
    onFacilitiesChanged?.();
  }, [loadFacilities, onFacilitiesChanged]);

  useEffect(() => {
    setFacilityPage(1);
    setSelectedState("all");
  }, [organizationId]);

  useEffect(() => {
    setFacilityPage(1);
  }, [selectedState]);

  useEffect(() => {
    if (facilityPage > totalFacilityPages) setFacilityPage(totalFacilityPages);
  }, [facilityPage, totalFacilityPages]);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      const [{ data: o }, { count: mCount }] = await Promise.all([
        supabase
          .from("organizations")
          .select("id,name,slug,logo_url,brand_color,accent_color")
          .eq("id", organizationId)
          .maybeSingle(),
        supabase
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);
      if (cancelled) return;
      const orgRow = o as OrgRow | null;
      setOrg(orgRow);
      setMemberCount(mCount ?? 0);
      if (orgRow) {
        setBrandColor(orgRow.brand_color || DEFAULT_BRAND);
        setAccentColor(orgRow.accent_color || "#E0EDFF");
        if (orgRow.logo_url) {
          const extracted = await extractLogoColor(orgRow.logo_url);
          if (cancelled) return;
          setLogoSuggested(extracted);
          if (!orgRow.brand_color && extracted) {
            setBrandColor(extracted);
          }
        } else {
          setLogoSuggested(null);
        }
      }

      const { data: statsRows } = await supabase.rpc("get_org_engagement_stats", {
        _org_id: organizationId,
      });
      if (cancelled) return;
      const row = Array.isArray(statsRows) ? statsRows[0] : statsRows;
      if (row) {
        setEngagement({
          page_views: Number(row.page_views ?? 0),
          call_clicks: Number(row.call_clicks ?? 0),
          text_clicks: Number(row.text_clicks ?? 0),
          email_clicks: Number(row.email_clicks ?? 0),
        });
      } else {
        setEngagement({ page_views: 0, call_clicks: 0, text_clicks: 0, email_clicks: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // Initial facility load only — do not notify parent or we can remount-loop.
  useEffect(() => {
    void loadFacilities();
  }, [loadFacilities]);

  const publicUrl =
    org?.slug && typeof window !== "undefined"
      ? `${window.location.origin}${orgPublicPath(org.slug)}`
      : null;

  const handleViewPublic = () => {
    if (publicUrl) window.open(publicUrl, "_blank", "noopener,noreferrer");
    else toast.error("Organization link isn't ready yet — add a slug in Branding.");
  };

  const handleShare = async () => {
    if (!publicUrl || !org) {
      toast.error("Organization link isn't ready yet.");
      return;
    }
    const ok = await shareOrCopyUrl({ url: publicUrl, title: org.name });
    if (ok) toast.success("Link copied", { description: publicUrl });
    else toast.error("Could not copy link");
  };

  const applyLogoColor = () => {
    if (!logoSuggested) {
      toast.error("Couldn't read colors from the logo.");
      return;
    }
    setBrandColor(logoSuggested);
  };

  const saveTheme = async () => {
    setSavingTheme(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        brand_color: brandColor.trim() || null,
        accent_color: accentColor.trim() || null,
      })
      .eq("id", organizationId);
    setSavingTheme(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Theme colors saved");
    setOrg((prev) =>
      prev
        ? { ...prev, brand_color: brandColor.trim() || null, accent_color: accentColor.trim() || null }
        : prev,
    );
  };

  return (
    <div className="space-y-5">
      {!adminMode && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>
            {org?.name && <p className="text-muted-foreground mt-0.5 truncate">{org.name}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleViewPublic} disabled={!publicUrl}>
              <ExternalLink className="h-4 w-4" /> Public page
            </Button>
            <AddFacilityDialog organizationId={organizationId} onCreated={reloadFacilities} />
          </div>
        </div>
      )}

      {/* Compact KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiTile
          label="Facilities"
          value={facilityCount}
          hint={facilityCount === 1 ? "Active" : "Active"}
          icon={Building2}
          to={facilitiesHref}
        />
        <KpiTile
          label="Team"
          value={memberCount}
          hint={memberCount === 1 ? "Member" : "Members"}
          icon={Users}
          to={membersHref}
        />
        <KpiTile
          label="Engagement"
          value={
            (engagement?.call_clicks ?? 0) +
            (engagement?.text_clicks ?? 0) +
            (engagement?.email_clicks ?? 0)
          }
          hint={`${engagement?.page_views ?? 0} views`}
          icon={BarChart3}
        />
        <Card className="p-3 flex items-center justify-around gap-1">
          {[
            { label: "Calls", value: engagement?.call_clicks ?? 0, icon: Phone },
            { label: "Texts", value: engagement?.text_clicks ?? 0, icon: MessageSquare },
            { label: "Emails", value: engagement?.email_clicks ?? 0, icon: Mail },
          ].map((m) => (
            <div key={m.label} className="text-center min-w-0 px-1">
              <m.icon className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
              <p className="font-heading text-lg font-bold leading-none tabular-nums">{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick actions + theme */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-3.5 sm:p-4">
          <h2 className="font-heading text-sm font-bold mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AddFacilityDialog
              organizationId={organizationId}
              onCreated={reloadFacilities}
              triggerLabel="Add facility"
              triggerClassName="w-full justify-start h-10"
              triggerVariant="outline"
            />
            <Button asChild variant="outline" className="h-10 justify-start">
              <Link to={facilitiesHref}>
                <Pencil className="h-4 w-4" /> Edit facilities
              </Link>
            </Button>
            {membersHref ? (
              <Button asChild variant="outline" className="h-10 justify-start">
                <Link to={membersHref}>
                  <UserPlus className="h-4 w-4" /> Manage team
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="h-10 justify-start">
                <Link to={brandingHref}>
                  <Users className="h-4 w-4" /> Org profile
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-10 justify-start">
              <Link to={brandingHref}>
                <Palette className="h-4 w-4" /> Full branding
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start"
              onClick={handleShare}
              disabled={!publicUrl}
            >
              <Share2 className="h-4 w-4" /> Share link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start"
              onClick={handleViewPublic}
              disabled={!publicUrl}
            >
              <ExternalLink className="h-4 w-4" /> Public page
            </Button>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-heading text-sm font-bold inline-flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-primary" /> Theme colors
            </h2>
            {logoSuggested && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={applyLogoColor}>
                <Sparkles className="h-3.5 w-3.5" /> Use logo color
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dash-brand" className="text-xs">
                Brand
              </Label>
              <div className="flex gap-2">
                <input
                  id="dash-brand"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-9 w-11 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dash-accent" className="text-xs">
                Accent
              </Label>
              <div className="flex gap-2">
                <input
                  id="dash-accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-11 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-8 flex-1 rounded-md border border-border/60"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%)`,
              }}
            />
            <Button type="button" size="sm" onClick={saveTheme} disabled={savingTheme}>
              {savingTheme ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Defaults from your logo when no brand color is set.
          </p>
        </Card>
      </div>

      {/* Facilities grid */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold">Facilities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredCount} {filteredCount === 1 ? "location" : "locations"}
              {selectedState !== "all" ? " in this state" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AddFacilityDialog organizationId={organizationId} onCreated={reloadFacilities} />
            <Button asChild variant="outline" size="sm">
              <Link to={facilitiesHref}>
                <Pencil className="h-3.5 w-3.5" /> Manage
              </Link>
            </Button>
          </div>
        </div>

        <OrgStateFilter
          states={facilityStates}
          selected={selectedState}
          onSelect={setSelectedState}
          brand={brandColor}
          className="mb-3"
        />

        {facilitiesLoading && allFacilities.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Loading facilities…</div>
        ) : allFacilities.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No facilities yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add programs so BD reps can share them.
            </p>
            <AddFacilityDialog organizationId={organizationId} onCreated={reloadFacilities} />
          </div>
        ) : pageFacilities.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No facilities in this state.</div>
        ) : (
          <>
            <FacilityGrid>
              {pageFacilities.map((f) => (
                <FacilityGridCard
                  key={f.id}
                  facility={f}
                  href={facilityDetailHref(f.id)}
                />
              ))}
            </FacilityGrid>

            {showFacilityPagination && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-1 border-t border-border/60">
                <p className="text-xs text-muted-foreground">
                  Showing {(facilityPage - 1) * FACILITIES_PAGE_SIZE + 1}–
                  {Math.min(facilityPage * FACILITIES_PAGE_SIZE, filteredCount)} of {filteredCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={facilityPage <= 1}
                    onClick={() => setFacilityPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums px-1">
                    {facilityPage} / {totalFacilityPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={facilityPage >= totalFacilityPages}
                    onClick={() => setFacilityPage((p) => Math.min(totalFacilityPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Building2;
  to?: string | null;
}) {
  const inner = (
    <Card
      className={cn(
        "p-3 h-full",
        to && "hover:border-primary/40 hover:shadow-sm transition-all",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <span className="h-7 w-7 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1 font-heading text-2xl font-bold tracking-tight tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
    </Card>
  );
  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}
