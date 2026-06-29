import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Shield,
  Plus,
  ExternalLink,
  Share2,
  Users,
  BarChart3,
  Pencil,
  ArrowRight,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Eye,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

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

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Updated ${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "Updated 1 day ago";
  if (d < 7) return `Updated ${d} days ago`;
  const w = Math.floor(d / 7);
  if (w === 1) return "Updated 1 week ago";
  if (w < 5) return `Updated ${w} weeks ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `Updated ${mo}mo ago`;
  return `Updated ${Math.floor(d / 365)}y ago`;
}

export default function Dashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [facilityCount, setFacilityCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [engagement, setEngagement] = useState<{
    page_views: number;
    share_clicks: number;
    call_clicks: number;
    text_clicks: number;
    email_clicks: number;
    referral_clicks: number;
  } | null>(null);

  const firstName = useMemo(
    () => (profile?.full_name ? profile.full_name.split(" ")[0] : "there"),
    [profile?.full_name]
  );

  useEffect(() => {
    if (!profile?.organization_id) return;
    const orgId = profile.organization_id;
    (async () => {
      const [{ data: o }, { data: f, count: fCount }, { count: mCount }] = await Promise.all([
        supabase.from("organizations").select("id,name,slug,logo_url").eq("id", orgId).maybeSingle(),
        supabase
          .from("facilities")
          .select("id,name,city,state,image_urls,updated_at", { count: "exact" })
          .eq("organization_id", orgId)
          .order("updated_at", { ascending: false })
          .limit(4),
        supabase
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("organization_id", orgId),
      ]);
      setOrg(o as OrgRow | null);
      setFacilities((f as FacilityRow[]) ?? []);
      setFacilityCount(fCount ?? 0);
      setMemberCount(mCount ?? 0);

      // Engagement stats (RLS-checked RPC)
      const { data: statsRows } = await supabase.rpc("get_org_engagement_stats", {
        _org_id: orgId,
      });
      const row = Array.isArray(statsRows) ? statsRows[0] : statsRows;
      if (row) {
        setEngagement({
          page_views: Number(row.page_views ?? 0),
          share_clicks: Number(row.share_clicks ?? 0),
          call_clicks: Number(row.call_clicks ?? 0),
          text_clicks: Number(row.text_clicks ?? 0),
          email_clicks: Number(row.email_clicks ?? 0),
          referral_clicks: Number((row as { referral_clicks?: number }).referral_clicks ?? 0),
        });
      } else {
        setEngagement({ page_views: 0, share_clicks: 0, call_clicks: 0, text_clicks: 0, email_clicks: 0, referral_clicks: 0 });
      }
    })();
  }, [profile?.organization_id]);

  const publicUrl = org?.slug ? `${window.location.origin}/${org.slug}` : null;

  const handleViewPublic = () => {
    if (publicUrl) window.open(publicUrl, "_blank", "noopener,noreferrer");
    else toast.error("Your organization link isn't ready yet.");
  };

  const handleShare = async () => {
    if (!publicUrl || !org) {
      toast.error("Your organization link isn't ready yet.");
      return;
    }
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ url: publicUrl, title: org.name });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied", { description: publicUrl });
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (!profile?.organization_id) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold">No organization linked</h1>
        <p className="text-muted-foreground mt-2">
          {isSuperAdmin
            ? "You're a super admin. Use Verifications to approve organizations as they come in."
            : "Get your network on CenterLinked by creating your organization. Takes about a minute."}
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          {isSuperAdmin ? (
            <Button asChild variant="outline">
              <Link to="/app/verifications">Open Verifications</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/create-organization">
                <Plus className="h-4 w-4" /> Create your organization
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const manageFacilitiesHref =
    facilityCount === 0
      ? "/app/onboarding?add=1"
      : facilities.length === 1
        ? `/app/facilities/${facilities[0].id}`
        : "/app/facilities";

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
      linkLabel: "Manage team",
      to: "/app/members",
      icon: Users,
    },
  ];

  const quickActions = [
    {
      label: "Update Facility Information",
      description: "Make sure your info is always current",
      icon: Pencil,
      to: manageFacilitiesHref,
    },
    {
      label: "View & Share Public Link",
      description: "Share your organization with partners",
      icon: Share2,
      onClick: handleShare,
    },
    {
      label: "Manage Team",
      description: "Add or update your BD team",
      icon: Users,
      to: "/app/members",
    },
    {
      label: "View Network Activity",
      description: "See who has viewed your network",
      icon: BarChart3,
      to: "/app/network",
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="truncate">Welcome back, {firstName}</span>
            <span aria-hidden>👋</span>
          </h1>
          {org?.name && (
            <p className="text-muted-foreground mt-1 truncate">{org.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleViewPublic} disabled={!publicUrl}>
            <ExternalLink className="h-4 w-4" /> View Public Link
          </Button>
          <Button asChild size="sm" className="shadow-md shadow-primary/20">
            <Link to={manageFacilitiesHref}>
              <Pencil className="h-4 w-4" /> Update Facility Info
            </Link>
          </Button>

        </div>
      </div>

      {/* Stat cards */}
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
            <Link
              to={s.to}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {s.linkLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        ))}

        {/* Network Activity — engagement KPIs from public shareable link */}
        <Card className="p-4 sm:p-5 hover:shadow-md hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Network Activity</p>
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className="font-heading text-3xl font-bold tracking-tight inline-flex items-center gap-1.5">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {engagement?.page_views ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">views</span>
            <span className="font-heading text-xl font-bold tracking-tight inline-flex items-center gap-1.5 ml-1">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              {engagement?.share_clicks ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">shares</span>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              title="Send a Referral clicks"
              className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded"
            >
              <Send className="h-3.5 w-3.5" />
              {engagement?.referral_clicks ?? 0} referrals
            </span>
            <span
              title="Call button clicks"
              className="inline-flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-1 rounded"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              {engagement?.call_clicks ?? 0}
            </span>
            <span
              title="Text button clicks"
              className="inline-flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-1 rounded"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              {engagement?.text_clicks ?? 0}
            </span>
            <span
              title="Email button clicks"
              className="inline-flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-1 rounded"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              {engagement?.email_clicks ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            From your public shareable link · all time
          </p>
        </Card>
      </div>

      {/* Two-column: Recently updated + Quick actions */}
      <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recently updated facilities */}
        <Card id="my-facilities" className="lg:col-span-2 p-4 sm:p-5 scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base sm:text-lg font-bold">Your Facilities</h2>
            {facilities.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/app/onboarding?add=1"><Plus className="h-3.5 w-3.5" /> Add facility</Link>
              </Button>
            )}
          </div>

          {facilities.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No facilities yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first facility to start sharing your network.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/app/onboarding?add=1"><Plus className="h-4 w-4" /> Add facility</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {facilities.map((f) => (
                <li key={f.id}>
                  <Link
                    to={`/app/facilities/${f.id}`}
                    className="flex items-center gap-3 sm:gap-4 py-3 group hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {f.image_urls?.[0] ? (
                        <img
                          src={f.image_urls[0]}
                          alt={f.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">
                        {f.name}
                      </p>
                      {(f.city || f.state) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[f.city, f.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
                      {relativeTime(f.updated_at)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Quick Actions */}
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
                    <Link to={a.to} className="block">{inner}</Link>
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
      </div>
    </div>
  );
}
