import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, MapPin, MessageSquare, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import {
  FacilityGridCard,
  facilityGridDensityForCount,
} from "@/components/FacilityGridCard";
import { orgPublicPath, programPublicPath } from "@/lib/public-urls";
import { sanitizePhone, formatPhoneDisplay } from "@/lib/phone";
import {
  asProfessionalProfile,
  bdProfileMetrics,
  connectShareUrl,
  initialsFromName,
  locationLine,
  type ProfessionalFacility,
  type ProfessionalProfileData,
} from "@/lib/professional-network";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";
import { cn } from "@/lib/utils";

type FacilityVisual = ProfessionalFacility & {
  image_urls?: string[];
  short_description?: string | null;
  tagline?: string | null;
  description?: string | null;
};

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function facilityGridClass(count: number) {
  if (count <= 1) return "grid grid-cols-1";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2";
}

export default function ProfessionalProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { requestConnection, respondToRequest, reload } = useProfessionalNetwork();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [facilities, setFacilities] = useState<FacilityVisual[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_professional_profile", { _user_id: userId });
    if (error) {
      toast.error(error.message);
      setProfile(null);
      setFacilities([]);
      setLoading(false);
      return;
    }
    const next = asProfessionalProfile(data);
    setProfile(next);
    if (!next?.facilities.length) {
      setFacilities([]);
      setLoading(false);
      return;
    }

    const ids = next.facilities.map((facility) => facility.id);
    const { data: extras } = await supabase
      .from("facilities")
      .select("id,image_urls,short_description,tagline,description")
      .in("id", ids)
      .eq("verification_status", "approved");
    const byId = new Map((extras ?? []).map((row) => [row.id, row]));
    setFacilities(
      next.facilities.map((facility) => {
        const extra = byId.get(facility.id);
        return {
          ...facility,
          image_urls: Array.isArray(extra?.image_urls) ? extra.image_urls : facility.image_urls,
          short_description: extra?.short_description ?? facility.short_description ?? null,
          tagline: extra?.tagline ?? facility.tagline ?? null,
          description: extra?.description ?? facility.description ?? null,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const metrics = useMemo(() => (profile ? bdProfileMetrics(profile) : null), [profile]);
  const payers = useMemo(() => {
    if (!profile) return [];
    return Array.from(new Set(profile.facilities.flatMap((facility) => facility.payers))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [profile]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-16 text-center">
        <p className="font-semibold">Professional not found</p>
        <Link to="/app/contacts" className="text-sm text-primary hover:underline">
          Back to Contacts
        </Link>
      </div>
    );
  }

  const name = profile.full_name || "CenterLinked professional";
  const place = locationLine(profile.city || profile.organization?.hq_city, profile.state || profile.organization?.hq_state);
  const tel = sanitizePhone(profile.phone);
  const displayPhone = formatPhoneDisplay(profile.phone) || formatPhoneDisplay(tel);
  const email = profile.email?.trim() || "";
  const isSelf = profile.connection_status === "self" || user?.id === profile.user_id;
  const orgHref = profile.organization?.slug ? orgPublicPath(profile.organization.slug) : null;
  const hasSidebar = Boolean(profile.bio || payers.length || profile.organization);

  const connect = async () => {
    setBusy(true);
    const { error } = await requestConnection(profile.user_id);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Connection request sent");
      await load();
      await reload();
    }
  };

  const accept = async () => {
    if (!profile.connection_id) return;
    setBusy(true);
    const { error } = await respondToRequest(profile.connection_id, true);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Connected");
      await load();
      await reload();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(connectShareUrl(window.location.origin, profile.user_id));
      toast.success("Connect link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        to="/app/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to Contacts
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-[hsl(var(--brand-purple))]" />
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-semibold text-primary ring-1 ring-border sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initialsFromName(name)
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-[1.75rem]">{name}</h1>
              {profile.job_title ? (
                <p className="text-sm font-medium text-foreground/80">{profile.job_title}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {profile.organization ? (
                  orgHref ? (
                    <Link to={orgHref} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      {profile.organization.logo_url ? (
                        <img
                          src={profile.organization.logo_url}
                          alt=""
                          className="h-5 w-5 rounded-md bg-background object-contain ring-1 ring-border"
                        />
                      ) : null}
                      {profile.organization.name}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      {profile.organization.name}
                    </span>
                  )
                ) : null}
                {place ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {place}
                  </span>
                ) : null}
              </div>
            </div>
            {metrics ? (
              <dl className="flex flex-wrap gap-2">
                <MetricChip value={metrics.facilities} label={metrics.facilities === 1 ? "facility" : "facilities"} />
                <MetricChip value={metrics.inNetwork} label="in-network" />
                <MetricChip value={metrics.states} label={metrics.states === 1 ? "state" : "states"} />
              </dl>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {isSelf ? (
                <Button size="sm" onClick={() => void copyLink()}>
                  <Share2 className="h-4 w-4" />
                  Share profile
                </Button>
              ) : (
                <ConnectButton status={profile.connection_status} busy={busy} onConnect={connect} onAccept={accept} />
              )}
              {tel ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${tel}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              ) : null}
              {email ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${email}`}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              ) : null}
              {tel ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`sms:${tel}`}>
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </a>
                </Button>
              ) : null}
              {!isSelf ? (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => void copyLink()} aria-label="Copy profile link">
                  <Share2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {email || displayPhone ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border/70 bg-muted/30 px-5 py-3 text-sm sm:px-6">
            {displayPhone && tel ? (
              <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {displayPhone}
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {email}
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className={cn("grid gap-5", hasSidebar && "xl:grid-cols-[minmax(0,1fr)_19rem]")}>
        <section className="min-w-0 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Facilities
            </h2>
            <p className="text-xs text-muted-foreground">
              {facilities.length} {facilities.length === 1 ? "location" : "locations"}
            </p>
          </div>
          {facilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              No facilities listed for this representative yet.
            </div>
          ) : (
            <div className={cn(facilityGridClass(facilities.length), facilities.length === 1 && "max-w-3xl")}>
              {facilities.map((facility) => (
                <FacilityGridCard
                  key={facility.id}
                  facility={facility}
                  href={
                    facility.slug && profile.organization?.slug
                      ? programPublicPath(facility.slug, profile.organization.slug)
                      : null
                  }
                  density={facilities.length === 1 ? "comfortable" : facilityGridDensityForCount(facilities.length)}
                  elevated
                />
              ))}
            </div>
          )}
        </section>

        {hasSidebar ? (
          <aside className="space-y-4">
            {profile.bio ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  About
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
              </div>
            ) : null}

            {profile.organization ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization
                </h2>
                {orgHref ? (
                  <Link to={orgHref} className="mt-3 flex items-center gap-3 rounded-xl p-1 -mx-1 transition-colors hover:bg-muted/60">
                    {profile.organization.logo_url ? (
                      <img
                        src={profile.organization.logo_url}
                        alt=""
                        className="h-11 w-11 rounded-xl bg-background object-contain p-1 ring-1 ring-border"
                      />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                        {initialsFromName(profile.organization.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{profile.organization.name}</p>
                      <p className="text-xs text-muted-foreground">View organization</p>
                    </div>
                  </Link>
                ) : (
                  <p className="mt-3 font-medium">{profile.organization.name}</p>
                )}
              </div>
            ) : null}

            {payers.length ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  In-network
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {payers.map((payer) => (
                    <span
                      key={payer}
                      className="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-foreground ring-1 ring-primary/15"
                    >
                      {payer}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function MetricChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-xs ring-1 ring-border/70">
      <dt className="sr-only">{label}</dt>
      <dd className="font-heading font-bold tabular-nums text-foreground">{formatCount(value)}</dd>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
