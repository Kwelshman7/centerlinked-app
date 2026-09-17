import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Mail, MapPin, MessageSquare, Phone, Share2 } from "lucide-react";
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
import { isPartnerVisibleFacility } from "@/lib/facility-visibility";
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
  const { userId, contactId } = useParams<{ userId?: string; contactId?: string }>();
  const { user } = useAuth();
  const { requestConnection, respondToRequest, reload } = useProfessionalNetwork();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [facilities, setFacilities] = useState<FacilityVisual[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const target = parseProfileTarget(userId, contactId);
    if (!target) {
      setProfile(null);
      setFacilities([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const loaded =
      target.kind === "user"
        ? await loadUserProfile(target.id)
        : target.kind === "rep"
          ? await loadRepProfile(target.id)
          : await loadFacilityContactProfile(target.id);

    if (!loaded) {
      setProfile(null);
      setFacilities([]);
      setLoading(false);
      return;
    }

    const orgId = loaded.profile.organization?.id ?? null;
    const orgFacilities = orgId ? await loadOrgFacilities(orgId, loaded.profile.facilities) : loaded.profile.facilities;
    setProfile({ ...loaded.profile, facilities: orgFacilities });
    setFacilities(orgFacilities);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId, contactId]);

  const metrics = useMemo(() => (profile ? bdProfileMetrics(profile) : null), [profile]);
  const payers = useMemo(() => {
    if (!profile) return [];
    return Array.from(new Set(profile.facilities.flatMap((facility) => facility.payers))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [profile]);
  const locations = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const facility of facilities) {
      const line = locationLine(facility.city, facility.state);
      if (!line || seen.has(line)) continue;
      seen.add(line);
      out.push(line);
    }
    return out;
  }, [facilities]);

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
  const isSelf = Boolean(profile.user_id) && (profile.connection_status === "self" || user?.id === profile.user_id);
  const canConnect = Boolean(profile.user_id) && !isSelf;
  const orgHref = profile.organization?.slug ? orgPublicPath(profile.organization.slug) : null;
  const hasSidebar = Boolean(profile.bio || payers.length || profile.organization || locations.length);

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
    <div className="mx-auto min-w-0 max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-[hsl(var(--brand-purple))]" />
        <div className="flex min-w-0 items-start gap-3 p-4 sm:gap-4 sm:p-6">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 text-base font-semibold text-primary ring-1 ring-border sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initialsFromName(name)
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h1 className="break-words font-heading text-xl font-bold tracking-tight sm:text-[1.75rem]">{name}</h1>
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
            ) : canConnect ? (
              <ConnectButton status={profile.connection_status} busy={busy} onConnect={connect} onAccept={accept} />
            ) : null}
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
              {!isSelf && canConnect ? (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => void copyLink()} aria-label="Copy profile link">
                  <Share2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {email || displayPhone ? (
          <div className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 border-t border-border/70 bg-muted/30 px-4 py-3 text-sm sm:px-6">
            {displayPhone && tel ? (
              <a href={`tel:${tel}`} className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{displayPhone}</span>
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`} className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{email}</span>
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

            {locations.length ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Locations
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {locations.map((line) => (
                    <li key={line} className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{line}</span>
                    </li>
                  ))}
                </ul>
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

type ProfileTarget =
  | { kind: "user"; id: string }
  | { kind: "rep"; id: string }
  | { kind: "facility"; id: string };

function parseProfileTarget(userId?: string, contactId?: string): ProfileTarget | null {
  if (userId) return { kind: "user", id: userId };
  if (!contactId) return null;
  const raw = decodeURIComponent(contactId);
  if (raw.startsWith("user:")) return { kind: "user", id: raw.slice(5) };
  if (raw.startsWith("rep:")) return { kind: "rep", id: raw.slice(4) };
  if (raw.startsWith("facility:")) return { kind: "facility", id: raw.slice(9) };
  return { kind: "user", id: raw };
}

function emptyProfile(partial: Partial<ProfessionalProfileData> & Pick<ProfessionalProfileData, "user_id">): ProfessionalProfileData {
  return {
    full_name: null,
    job_title: null,
    avatar_url: null,
    phone: null,
    email: null,
    bio: null,
    city: null,
    state: null,
    organization: null,
    connection_status: "none",
    connection_id: null,
    facilities: [],
    ...partial,
  };
}

async function loadUserProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase.rpc("get_professional_profile", { _user_id: id });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const next = asProfessionalProfile(data);
  return next ? { profile: next } : null;
}

async function loadRepProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase
    .from("bd_representatives")
    .select("id,user_id,full_name,title,email,phone,avatar_url,organization_id,organization_name,states_covered")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.user_id) return loadUserProfile(data.user_id);

  let organization = null;
  if (data.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id,name,slug,logo_url,hq_city,hq_state,verified")
      .eq("id", data.organization_id)
      .maybeSingle();
    if (org) {
      organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        hq_city: org.hq_city,
        hq_state: org.hq_state,
        verified: org.verified,
      };
    }
  } else if (data.organization_name) {
    organization = {
      id: data.organization_id || data.id,
      name: data.organization_name,
      slug: null,
      logo_url: null,
    };
  }

  const state = Array.isArray(data.states_covered) ? data.states_covered.find(Boolean) ?? null : null;
  return {
    profile: emptyProfile({
      user_id: "",
      full_name: data.full_name,
      job_title: data.title,
      avatar_url: data.avatar_url,
      phone: data.phone,
      email: data.email,
      state,
      organization,
    }),
  };
}

async function loadFacilityContactProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase
    .from("facilities")
    .select(
      "id,name,city,state,bd_contact_name,bd_contact_phone,bd_contact_email,bd_contact_title,organization_id,organizations(id,name,slug,logo_url,hq_city,hq_state,verified)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const orgRow = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const organization = orgRow
    ? {
        id: orgRow.id,
        name: orgRow.name,
        slug: orgRow.slug,
        logo_url: orgRow.logo_url,
        hq_city: orgRow.hq_city,
        hq_state: orgRow.hq_state,
        verified: orgRow.verified,
      }
    : null;
  return {
    profile: emptyProfile({
      user_id: "",
      full_name: data.bd_contact_name,
      job_title: data.bd_contact_title,
      phone: data.bd_contact_phone,
      email: data.bd_contact_email,
      city: data.city,
      state: data.state,
      organization,
    }),
  };
}

async function loadOrgFacilities(orgId: string, existing: FacilityVisual[]): Promise<FacilityVisual[]> {
  const { data: rows } = await supabase
    .from("facilities")
    .select(
      "id,name,slug,city,state,levels_of_care,image_urls,short_description,tagline,description,verification_status,verification_frozen,hidden_from_org_page",
    )
    .eq("organization_id", orgId)
    .eq("verification_status", "approved");
  const visible = (rows ?? []).filter((row) =>
    isPartnerVisibleFacility(row, { honorHiddenFromOrgPage: true }),
  );
  const ids = visible.map((row) => row.id);
  const payersByFacility = new Map<string, string[]>();
  if (ids.length) {
    const { data: contracts } = await supabase
      .from("insurance_contracts")
      .select("facility_id,payer_name,in_network")
      .in("facility_id", ids)
      .eq("in_network", true);
    for (const row of contracts ?? []) {
      const name = row.payer_name?.trim();
      if (!name) continue;
      const list = payersByFacility.get(row.facility_id) ?? [];
      if (!list.some((item) => item.toLowerCase() === name.toLowerCase())) list.push(name);
      payersByFacility.set(row.facility_id, list);
    }
  }
  const byId = new Map(existing.map((facility) => [facility.id, facility]));
  const merged = visible.map((row) => {
    const prev = byId.get(row.id);
    const fromContracts = payersByFacility.get(row.id) ?? [];
    const payers = fromContracts.length ? fromContracts : prev?.payers ?? [];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      city: row.city,
      state: row.state,
      levels_of_care: row.levels_of_care ?? prev?.levels_of_care ?? [],
      payers,
      image_urls: Array.isArray(row.image_urls) ? row.image_urls : prev?.image_urls,
      short_description: row.short_description ?? prev?.short_description ?? null,
      tagline: row.tagline ?? prev?.tagline ?? null,
      description: row.description ?? prev?.description ?? null,
    } satisfies FacilityVisual;
  });
  merged.sort((a, b) => {
    const loc = (locationLine(a.city, a.state) || "").localeCompare(locationLine(b.city, b.state) || "");
    if (loc !== 0) return loc;
    return a.name.localeCompare(b.name);
  });
  return merged;
}
