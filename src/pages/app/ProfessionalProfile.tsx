import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Mail, Phone, Share2, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function gridClassForCount(count: number) {
  if (count <= 1) return "grid grid-cols-1 gap-4";
  if (count === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-4";
  return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
}

export default function ProfessionalProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { requestConnection, respondToRequest, reload } = useProfessionalNetwork();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [facilities, setFacilities] = useState<FacilityVisual[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"facilities" | "about">("facilities");

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
      <div className="py-20 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-2">
        <p className="font-semibold">Professional not found</p>
        <Link to="/app/network" className="text-sm text-primary hover:underline">
          Back to Network
        </Link>
      </div>
    );
  }

  const name = profile.full_name || "CenterLinked professional";
  const place = locationLine(profile.city || profile.organization?.hq_city, profile.state || profile.organization?.hq_state);
  const tel = sanitizePhone(profile.phone);
  const isSelf = profile.connection_status === "self" || user?.id === profile.user_id;
  const titleLine = [profile.job_title, place ? `based in ${place}` : null].filter(Boolean).join(" ");

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

  const actionClass =
    "h-10 rounded-full px-5 text-sm font-semibold";

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/app/network" className="text-sm text-primary hover:underline">
        Back to Network
      </Link>

      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="relative h-36 sm:h-48 overflow-hidden bg-secondary">
          <div
            className="absolute -right-10 -top-20 h-[160%] w-[75%] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 38% 42%, hsl(var(--brand-purple) / 0.42) 0%, hsl(var(--primary) / 0.22) 38%, transparent 72%)",
            }}
            aria-hidden
          />
        </div>

        <div className="px-5 sm:px-8">
          <div className="-mt-16 sm:-mt-[4.5rem]">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden bg-primary/10 text-primary grid place-items-center text-2xl font-semibold ring-4 ring-card shadow-md">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsFromName(name)
              )}
            </div>
          </div>

          <div className="pt-4 pb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 space-y-3">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {name}
                </h1>
                {titleLine ? (
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">{titleLine}</p>
                ) : null}
                {profile.organization ? (
                  <p className="text-sm mt-1">
                    {profile.organization.slug ? (
                      <Link
                        to={orgPublicPath(profile.organization.slug)}
                        className="font-medium text-primary hover:underline"
                      >
                        {profile.organization.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{profile.organization.name}</span>
                    )}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isSelf ? (
                  <Button variant="hero" className={actionClass} onClick={() => void copyLink()}>
                    <Share2 className="h-4 w-4" />
                    Share profile
                  </Button>
                ) : (
                  <ConnectButton
                    status={profile.connection_status}
                    busy={busy}
                    onConnect={connect}
                    onAccept={accept}
                    className={cn(actionClass, "h-10 px-5 text-sm")}
                  />
                )}
                <GetInTouchButton name={name} email={profile.email} phone={tel} displayPhone={profile.phone} />
                {!isSelf ? (
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => void copyLink()} aria-label="Copy profile link">
                    <Share2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            {metrics ? (
              <dl className="flex items-start gap-8 sm:gap-10 shrink-0">
                <Metric value={metrics.facilities} label="Facilities" />
                <Metric value={metrics.inNetwork} label="In-network" />
                <Metric value={metrics.states} label="States" />
              </dl>
            ) : null}
          </div>

          <div className="border-b border-border/70 flex items-center gap-6">
            <TabButton
              active={tab === "facilities"}
              onClick={() => setTab("facilities")}
              count={facilities.length}
            >
              Facilities
            </TabButton>
            <TabButton active={tab === "about"} onClick={() => setTab("about")}>
              About
            </TabButton>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-6 sm:py-8">
          {tab === "facilities" ? (
            <div className="space-y-6">
              {profile.organization ? (
                <div className="flex justify-center">
                  {profile.organization.logo_url ? (
                    <Link
                      to={profile.organization.slug ? orgPublicPath(profile.organization.slug) : "/app/network"}
                      className="block"
                      aria-label={`${profile.organization.name} profile`}
                    >
                      <img
                        src={profile.organization.logo_url}
                        alt={`${profile.organization.name} logo`}
                        className="h-16 sm:h-20 w-auto max-w-[14rem] object-contain"
                      />
                    </Link>
                  ) : (
                    <p className="font-heading text-lg font-bold text-center">{profile.organization.name}</p>
                  )}
                </div>
              ) : null}

              {facilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No facilities listed for this representative yet.
                </p>
              ) : (
                <div className={gridClassForCount(facilities.length)}>
                  {facilities.map((facility) => (
                    <FacilityGridCard
                      key={facility.id}
                      facility={facility}
                      href={
                        facility.slug && profile.organization?.slug
                          ? programPublicPath(facility.slug, profile.organization.slug)
                          : null
                      }
                      density={facilityGridDensityForCount(facilities.length)}
                      elevated
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              {profile.bio ? (
                <p className="text-sm sm:text-base leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No bio yet.</p>
              )}
              {place ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {place}
                </p>
              ) : null}
              {payers.length ? (
                <div className="space-y-2">
                  <h2 className="font-heading font-semibold">In-network</h2>
                  <div className="flex flex-wrap gap-2">
                    {payers.map((payer) => (
                      <span
                        key={payer}
                        className="rounded-full bg-primary/8 text-foreground px-2.5 py-1 text-xs font-medium ring-1 ring-primary/15"
                      >
                        {payer}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center min-w-[4.5rem]">
      <dt className="text-[11px] sm:text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
        {formatCount(value)}
      </dd>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative -mb-px pb-3 text-sm font-semibold transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {typeof count === "number" ? (
        <span className="ml-1 text-[11px] font-medium text-muted-foreground">{count}</span>
      ) : null}
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground" /> : null}
    </button>
  );
}

function GetInTouchButton({
  name,
  email,
  phone,
  displayPhone,
}: {
  name: string;
  email?: string | null;
  phone?: string | null;
  displayPhone?: string | null;
}) {
  const mail = email?.trim() || "";
  const tel = phone || "";
  if (!mail && !tel) return null;

  if (mail && tel) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="hero-outline" className="h-10 rounded-full px-5 text-sm font-semibold">
            Get in touch
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <Button asChild variant="ghost" className="w-full justify-start font-normal h-10">
            <a href={`mailto:${mail}`}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start font-normal h-10">
            <a href={`tel:${tel}`}>
              <Phone className="h-4 w-4" />
              Call{displayPhone ? ` · ${formatPhoneDisplay(displayPhone)}` : ""}
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start font-normal h-10">
            <a href={`sms:${tel}`}>
              <MessageSquare className="h-4 w-4" />
              Text
            </a>
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button asChild variant="hero-outline" className="h-10 rounded-full px-5 text-sm font-semibold">
      <a href={mail ? `mailto:${mail}` : `tel:${tel}`} aria-label={`Get in touch with ${name}`}>
        Get in touch
      </a>
    </Button>
  );
}
