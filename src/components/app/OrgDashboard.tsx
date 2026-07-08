import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Share2,
  Users,
  BarChart3,
  Pencil,
  ArrowRight,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatUpdatedAt } from "@/lib/relative-time";
import { shareOrCopyUrl } from "@/lib/share";
import { orgPublicPath } from "@/lib/public-urls";

interface OrgRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
}

interface FacilityRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  image_urls: string[] | null;
  updated_at: string;
}

interface Props {
  organizationId: string;
  /** Super-admin setup mode — links point to admin workspace paths. */
  adminMode?: boolean;
  welcomeName?: string;
}

const FACILITIES_PAGE_SIZE = 5;

export function OrgDashboard({ organizationId, adminMode = false, welcomeName = "there" }: Props) {
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [facilityCount, setFacilityCount] = useState(0);
  const [facilityPage, setFacilityPage] = useState(1);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
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

  useEffect(() => {
    setFacilityPage(1);
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      const [{ data: o }, { count: fCount }, { count: mCount }] = await Promise.all([
        supabase.from("organizations").select("id,name,slug,logo_url").eq("id", organizationId).maybeSingle(),
        supabase
          .from("facilities")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
        supabase
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);
      setOrg(o as OrgRow | null);
      setFacilityCount(fCount ?? 0);
      setMemberCount(mCount ?? 0);

      const { data: statsRows } = await supabase.rpc("get_org_engagement_stats", {
        _org_id: organizationId,
      });
      const row = Array.isArray(statsRows) ? statsRows[0] : statsRows;
      if (row) {
        setEngagement({
          page_views: Number(row.page_views ?? 0),
          call_clicks: Number(row.call_clicks ?? 0),
          text_clicks: Number(row.text_clicks ?? 0),
          email_clicks: Number(row.email_clicks ?? 0),
        });
      } else {
        setEngagement({
          page_views: 0,
          call_clicks: 0,
          text_clicks: 0,
          email_clicks: 0,
        });
      }
    })();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      setFacilitiesLoading(true);
      const from = (facilityPage - 1) * FACILITIES_PAGE_SIZE;
      const to = from + FACILITIES_PAGE_SIZE - 1;
      const { data: f } = await supabase
        .from("facilities")
        .select("id,name,city,state,image_urls,updated_at")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      setFacilities((f as FacilityRow[]) ?? []);
      setFacilitiesLoading(false);
    })();
  }, [organizationId, facilityPage]);

  const totalFacilityPages = Math.max(1, Math.ceil(facilityCount / FACILITIES_PAGE_SIZE));
  const showFacilityPagination = facilityCount > FACILITIES_PAGE_SIZE;
  const facilityRangeStart = facilityCount === 0 ? 0 : (facilityPage - 1) * FACILITIES_PAGE_SIZE + 1;
  const facilityRangeEnd = Math.min(facilityPage * FACILITIES_PAGE_SIZE, facilityCount);

  const publicUrl =
    org?.slug && typeof window !== "undefined"
      ? `${window.location.origin}${orgPublicPath(org.slug)}`
      : null;

  const manageFacilitiesHref = adminMode
    ? `/app/admin/organizations/${organizationId}?tab=facilities`
    : facilityCount === 0
      ? "/app/onboarding?add=1"
      : facilities.length === 1
        ? `/app/facilities/${facilities[0].id}`
        : "/app/facilities";

  const adminTabHref = (tab: "links" | "branding" | "facilities") =>
    `/app/admin/organizations/${organizationId}?tab=${tab}`;

  const facilityDetailHref = (id: string) =>
    adminMode ? `/app/facilities/${id}` : `/app/facilities/${id}`;

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

  const stats = [
    {
      label: "Facilities",
      value: facilityCount,
      sublabel: facilityCount === 1 ? "Active facility" : "Active facilities",
      linkLabel: facilityCount === 1 ? "Edit facility" : "Manage facilities",
      to: manageFacilitiesHref,
      icon: Building2,
    },
    {
      label: "BD Team Members",
      value: memberCount,
      sublabel: memberCount === 1 ? "Active user" : "Active users",
      linkLabel: adminMode ? null : "Manage team",
      to: adminMode ? null : "/app/members",
      icon: Users,
    },
  ];

  const quickActions = adminMode
    ? []
    : [
    {
      label: "Update Facility Information",
      description: "Make sure program info is always current",
      icon: Pencil,
      to: manageFacilitiesHref,
    },
    {
      label: "View & Share Public Link",
      description: "Copy the org page BD reps will share",
      icon: Share2,
      onClick: handleShare,
    },
    {
      label: "Organization settings",
      description: "Logo, colors, and referral contact",
      icon: Building2,
      to: "/app/settings",
    },
    {
      label: "Shared program links",
      description: "Copy links for each facility program sheet",
      icon: BarChart3,
      to: manageFacilitiesHref,
    },
  ];

  return (
    <div className="space-y-6">
      {!adminMode && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>
            {org?.name && (
              <p className="text-muted-foreground mt-1 truncate">{org.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleViewPublic} disabled={!publicUrl}>
              <ExternalLink className="h-4 w-4" /> View public page
            </Button>
            <Button asChild size="sm" className="shadow-md shadow-primary/20">
              <Link to={manageFacilitiesHref}>
                <Pencil className="h-4 w-4" /> Manage facilities
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5 hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 font-heading text-3xl font-bold tracking-tight">{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.sublabel}</p>
            {s.linkLabel && s.to && (
              <Link
                to={s.to}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                {s.linkLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </Card>
        ))}

        <Card className="p-4 sm:p-5 hover:shadow-md hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact engagement</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                When partners tap call, text, or email on your public profile
              </p>
            </div>
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Calls", value: engagement?.call_clicks ?? 0, icon: Phone },
              { label: "Texts", value: engagement?.text_clicks ?? 0, icon: MessageSquare },
              { label: "Emails", value: engagement?.email_clicks ?? 0, icon: Mail },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-center"
              >
                <metric.icon className="h-4 w-4 text-primary mx-auto mb-2" />
                <p className="font-heading text-2xl font-bold tracking-tight leading-none">{metric.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{metric.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/60">
            {engagement?.page_views ?? 0} profile views · all time
          </p>
        </Card>
      </div>

      <div className={`grid gap-4 lg:gap-6 grid-cols-1 ${adminMode ? "" : "lg:grid-cols-3"}`}>
        <Card className={`p-4 sm:p-5 ${adminMode ? "" : "lg:col-span-2"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base sm:text-lg font-bold">Recent facilities</h2>
            {adminMode ? (
              <Button asChild variant="ghost" size="sm">
                <Link to={adminTabHref("facilities")}>
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to={manageFacilitiesHref}>
                  <Plus className="h-3.5 w-3.5" /> Add facility
                </Link>
              </Button>
            )}
          </div>

          {facilitiesLoading && facilities.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading facilities…</div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No facilities yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add programs so BD reps can share them.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {facilities.map((f) => (
                  <li key={f.id}>
                    <Link
                      to={facilityDetailHref(f.id)}
                      className="flex items-center gap-3 sm:gap-4 py-3 group hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        {f.image_urls?.[0] ? (
                          <img src={f.image_urls[0]} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{f.name}</p>
                        {(f.city || f.state) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[f.city, f.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
                        {formatUpdatedAt(f.updated_at)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
              {showFacilityPagination && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 mt-1 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Showing {facilityRangeStart}–{facilityRangeEnd} of {facilityCount} facilities
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={facilityPage <= 1 || facilitiesLoading}
                      onClick={() => setFacilityPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums px-1">
                      Page {facilityPage} of {totalFacilityPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={facilityPage >= totalFacilityPages || facilitiesLoading}
                      onClick={() => setFacilityPage((page) => Math.min(totalFacilityPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {!adminMode && quickActions.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="font-heading text-base sm:text-lg font-bold mb-4">Quick Actions</h2>
          <ul className="space-y-2">
            {quickActions.map((a) => {
              const inner = (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  </div>
                </div>
              );
              return (
                <li key={a.label}>
                  {a.to ? (
                    <Link to={a.to} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" onClick={a.onClick} className="block w-full text-left">
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        )}
      </div>
    </div>
  );
}
