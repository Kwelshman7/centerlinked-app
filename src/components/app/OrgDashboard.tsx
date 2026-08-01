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
  ExternalLink,
  Palette,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { shareOrCopyUrl } from "@/lib/share";
import { orgPublicPath } from "@/lib/public-urls";
import { resolveStateCode } from "@/lib/us-states";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { AddFacilityDialog } from "@/components/app/facility/AddFacilityDialog";
import { AssignFacilityBdDialog } from "@/components/app/facility/AssignFacilityBdDialog";
import { FacilityGridCard } from "@/components/FacilityGridCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface OrgRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

interface FacilityRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  image_urls: string[] | null;
  levels_of_care: string[] | null;
  updated_at: string;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  hidden_from_org_page?: boolean;
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
  const { isFacilityAdmin, isSuperAdmin } = useAuth();
  const canManageFacilityVisibility = adminMode || isFacilityAdmin || isSuperAdmin;
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [allFacilities, setAllFacilities] = useState<FacilityRow[]>([]);
  const [facilityPage, setFacilityPage] = useState(1);
  const [selectedState, setSelectedState] = useState("all");
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [visibilitySavingId, setVisibilitySavingId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [engagement, setEngagement] = useState<{
    page_views: number;
    call_clicks: number;
    text_clicks: number;
    email_clicks: number;
  } | null>(null);

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
      .select(
        "id,name,city,state,image_urls,levels_of_care,updated_at,bd_contact_name,bd_contact_phone,bd_contact_email,hidden_from_org_page",
      )
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
          .select("id,name,slug,logo_url,brand_color")
          .eq("id", organizationId)
          .maybeSingle(),
        supabase
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);
      if (cancelled) return;
      setOrg(o as OrgRow | null);
      setMemberCount(mCount ?? 0);

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

  const toggleFacilityVisibility = async (facility: FacilityRow) => {
    if (!canManageFacilityVisibility) return;
    const nextHidden = !facility.hidden_from_org_page;
    setVisibilitySavingId(facility.id);
    try {
      const { error } = await supabase
        .from("facilities")
        .update({ hidden_from_org_page: nextHidden })
        .eq("id", facility.id)
        .eq("organization_id", organizationId);
      if (error) throw error;
      toast.success(nextHidden ? "Facility hidden from the public organization profile" : "Facility is visible on the public organization profile");
      await reloadFacilities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update facility visibility");
    } finally {
      setVisibilitySavingId(null);
    }
  };

  const brandColor = org?.brand_color || DEFAULT_BRAND;

  return (
    <div className="space-y-4 sm:space-y-5">
      {!adminMode && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>
            {org?.name && <p className="text-sm text-muted-foreground mt-1 truncate">{org.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0 sm:flex sm:items-center sm:flex-wrap">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleViewPublic} disabled={!publicUrl}>
              <ExternalLink className="h-4 w-4" /> Public page
            </Button>
            <AddFacilityDialog organizationId={organizationId} onCreated={reloadFacilities} triggerClassName="w-full sm:w-auto" />
          </div>
        </div>
      )}

      {/* Compact KPIs */}
      <section aria-label="Organization overview">
        <div className="flex items-center justify-between px-0.5 mb-2 sm:hidden">
          <h2 className="font-heading text-sm font-bold">At a glance</h2>
          <span className="text-[11px] text-muted-foreground">Organization activity</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
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
          label="Views"
          value={engagement?.page_views ?? 0}
          hint="Profile views"
          icon={BarChart3}
        />
        <KpiTile
          label="Referrals"
          value={
            (engagement?.call_clicks ?? 0) +
            (engagement?.text_clicks ?? 0) +
            (engagement?.email_clicks ?? 0)
          }
          hint="Calls, texts, email"
          icon={Phone}
        />
        </div>
      </section>

      {/* Quick actions */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-heading text-sm font-bold">Quick actions</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 sm:hidden">Manage your profile, team, and facilities.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <AddFacilityDialog
            organizationId={organizationId}
            onCreated={reloadFacilities}
            triggerLabel="Add facility"
            triggerClassName="w-full justify-start h-11 sm:h-10"
            triggerVariant="outline"
          />
          <Button asChild variant="outline" className="h-11 justify-start sm:h-10">
            <Link to={facilitiesHref}>
              <Pencil className="h-4 w-4" /> Edit facilities
            </Link>
          </Button>
          {membersHref ? (
            <Button asChild variant="outline" className="h-11 justify-start sm:h-10">
              <Link to={membersHref}>
                <UserPlus className="h-4 w-4" /> Manage team
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="h-11 justify-start sm:h-10">
              <Link to={brandingHref}>
                <Users className="h-4 w-4" /> Org profile
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="h-11 justify-start sm:h-10">
            <Link to={brandingHref}>
              <Palette className="h-4 w-4" /> Full branding
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start sm:h-10"
            onClick={handleShare}
            disabled={!publicUrl}
          >
            <Share2 className="h-4 w-4" /> Share link
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start sm:h-10"
            onClick={handleViewPublic}
            disabled={!publicUrl}
          >
            <ExternalLink className="h-4 w-4" /> Public page
          </Button>
        </div>
      </Card>

      {/* Facilities grid */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold">Facilities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredCount} {filteredCount === 1 ? "location" : "locations"}
              {selectedState !== "all" ? " in this state" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
            <AddFacilityDialog organizationId={organizationId} onCreated={reloadFacilities} triggerClassName="w-full sm:w-auto" />
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {pageFacilities.map((f) => (
                <div key={f.id} className="min-w-0 flex flex-col gap-2">
                  <FacilityGridCard
                    facility={f}
                    href={facilityDetailHref(f.id)}
                  />
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <p className="text-[11px] text-muted-foreground truncate min-w-0">
                      {f.hidden_from_org_page ? (
                        <span className="inline-flex items-center gap-1 text-amber-700/90">
                          <EyeOff className="h-3 w-3" /> Hidden from public organization profile
                        </span>
                      ) : f.bd_contact_name?.trim() ? (
                        <>
                          <span className="font-medium text-foreground/80">BD:</span>{" "}
                          {f.bd_contact_name}
                        </>
                      ) : (
                        <span className="text-amber-700/80">No BD assigned</span>
                      )}
                    </p>
                    <div className="flex items-center shrink-0">
                      {canManageFacilityVisibility && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          disabled={visibilitySavingId === f.id}
                          onClick={() => void toggleFacilityVisibility(f)}
                          aria-label={f.hidden_from_org_page ? `Show ${f.name} on the public organization profile` : `Hide ${f.name} from the public organization profile`}
                        >
                          {f.hidden_from_org_page ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {f.hidden_from_org_page ? "Show" : "Hide"}
                        </Button>
                      )}
                      <AssignFacilityBdDialog
                        facilityId={f.id}
                        facilityName={f.name}
                        organizationId={organizationId}
                        bd_contact_name={f.bd_contact_name}
                        bd_contact_phone={f.bd_contact_phone}
                        bd_contact_email={f.bd_contact_email}
                        onSaved={reloadFacilities}
                        triggerVariant="ghost"
                        triggerClassName="h-7 px-2 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
        "p-2 sm:p-3 h-full min-w-0",
        to && "hover:border-primary/40 hover:shadow-sm transition-all",
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{label}</p>
        <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
        </span>
      </div>
      <p className="mt-1 font-heading text-xl sm:text-2xl font-bold tracking-tight tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-1 truncate">{hint}</p>
    </Card>
  );
  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}
