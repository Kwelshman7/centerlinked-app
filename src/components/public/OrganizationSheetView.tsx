import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Globe,
  BadgeCheck,
  Calendar,
  Building2,
  Award,
  Users,
  HeartPulse,
  Home,
  Layers,
  Sparkles,
  ChevronRight,
  FileText,
  Star,
  Check,
} from "lucide-react";
import { ShareSheetButton } from "@/components/app/ShareSheetButton";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgFooter } from "@/components/public/OrgFooter";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { ContractRow } from "@/lib/derive-insurance";
import { programPublicPath } from "@/lib/public-urls";
import { resolveStateCode } from "@/lib/us-states";
import { cn } from "@/lib/utils";

export interface OrgSheetData {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  website: string | null;
  hq_city: string | null;
  hq_state: string | null;
  brand_color: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  program_badges: string[];
  announcement: string | null;
  why_refer: { title: string; body: string }[];
}

export type OrgTab =
  | "overview"
  | "facilities"
  | "services"
  | "insurance"
  | "accreditations"
  | "resources"
  | "reviews";

interface Props {
  org: OrgSheetData;
  facilities: ShowcaseFacility[];
  contracts: ContractRow[];
  heroContact: HeroContact | null;
  brand: string;
  facilityStates: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
  activeTab?: OrgTab;
  onTabChange?: (tab: OrgTab) => void;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function fmtYear(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).getFullYear().toString();
  } catch {
    return null;
  }
}

function levelIcon(level: string) {
  const l = level.toLowerCase();
  if (l.includes("detox")) return HeartPulse;
  if (l.includes("residential") || l.includes("inpatient")) return Home;
  if (l.includes("outpatient") || l.includes("iop") || l.includes("php")) return Users;
  return Layers;
}

function levelDescription(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("iop")) return "Structured outpatient treatment several days per week.";
  if (l.includes("outpatient") || l === "op") return "Flexible treatment while living at home.";
  if (l.includes("telehealth")) return "Virtual care and support from anywhere.";
  if (l.includes("detox")) return "Medically supervised withdrawal management.";
  if (l.includes("residential") || l.includes("inpatient")) return "24/7 residential treatment and support.";
  return "Treatment program offered at this organization.";
}

function CardShell({
  title,
  children,
  className = "",
  headerClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden", className)}>
      <div className={cn("px-5 py-3.5 border-b border-border/60", headerClassName)}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetaColumn({
  icon: Icon,
  label,
  value,
  brand,
  href,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  brand: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0 px-4 py-3 sm:py-4 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: brand }} />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</span>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium truncate hover:underline"
          style={{ color: brand }}
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium truncate">{value}</p>
      )}
    </div>
  );
}

function FacilityPreviewCard({
  facility,
  orgSlug,
  brand,
  isMain,
}: {
  facility: ShowcaseFacility;
  orgSlug: string | null;
  brand: string;
  isMain?: boolean;
}) {
  const href = facility.slug ? programPublicPath(facility.slug, orgSlug) : null;
  const loc = [facility.city, facility.state].filter(Boolean).join(", ");

  return (
    <div className="w-[220px] sm:w-[240px] shrink-0 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm flex flex-col">
      <div className="relative aspect-[4/3] bg-muted">
        {facility.image_urls?.[0] ? (
          <img src={facility.image_urls[0]} alt={facility.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isMain && (
          <span
            className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: brand }}
          >
            Main Location
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-heading font-bold text-sm leading-tight">{facility.name}</p>
          {loc && (
            <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {loc}
            </p>
          )}
        </div>
        {facility.levels_of_care.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {facility.levels_of_care.slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${brand}14`, color: brand }}
              >
                {l}
              </span>
            ))}
          </div>
        )}
        {href ? (
          <Link
            to={href}
            className="mt-auto text-xs font-semibold inline-flex items-center gap-0.5 hover:underline"
            style={{ color: brand }}
          >
            View details <ChevronRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function OrganizationSheetView({
  org,
  facilities,
  contracts,
  heroContact,
  brand,
  facilityStates,
  selectedState,
  onStateChange,
  activeTab: controlledTab,
  onTabChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<OrgTab>("overview");
  const activeTab = controlledTab ?? internalTab;

  const setTab = (tab: OrgTab) => {
    if (controlledTab === undefined) setInternalTab(tab);
    onTabChange?.(tab);
  };

  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const foundedYear = fmtYear(org.created_at);
  const lastUpdated = fmtDate(org.updated_at);

  const filteredFacilities = useMemo(() => {
    if (selectedState === "all") return facilities;
    return facilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [facilities, selectedState]);

  const inNetworkPayers = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const c of contracts) {
      if (!c.in_network) continue;
      const key = c.payer_name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      names.push(c.payer_name.trim());
    }
    return names.sort((a, b) => a.localeCompare(b));
  }, [contracts]);

  const hasInNetwork = inNetworkPayers.length > 0;

  const allLevels = useMemo(() => {
    const seen = new Set<string>();
    const levels: string[] = [];
    for (const f of facilities) {
      for (const l of f.levels_of_care ?? []) {
        const key = l.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        levels.push(l.trim());
      }
    }
    return levels;
  }, [facilities]);

  const allAccreditations = useMemo(() => {
    const seen = new Set<string>();
    const accs: string[] = [];
    for (const f of facilities) {
      for (const a of f.accreditations ?? []) {
        const key = a.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        accs.push(a.trim());
      }
    }
    for (const b of org.program_badges) {
      const key = b.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      accs.push(b.trim());
    }
    return accs;
  }, [facilities, org.program_badges]);

  const facilityType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of facilities) {
      const focus = f.levels_of_care?.[0];
      if (focus) counts.set(focus, (counts.get(focus) ?? 0) + 1);
    }
    let best = "";
    let bestCount = 0;
    for (const [k, v] of counts) {
      if (v > bestCount) {
        best = k;
        bestCount = v;
      }
    }
    return best || allLevels[0] || null;
  }, [facilities, allLevels]);

  const primaryAccreditation = allAccreditations[0] ?? null;

  const allPopulations = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const f of facilities) {
      for (const p of f.population_served ?? []) {
        const key = p.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        items.push(p.trim());
      }
    }
    return items;
  }, [facilities]);

  const allSpecializations = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const f of facilities) {
      for (const s of [...(f.specializations ?? []), ...(f.highlights ?? [])]) {
        const key = s.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        items.push(s.trim());
      }
    }
    return items;
  }, [facilities]);

  const mainFacilityId = useMemo(() => {
    if (facilities.length === 0) return null;
    const hqMatch = facilities.find(
      (f) =>
        f.city?.toLowerCase() === org.hq_city?.toLowerCase() &&
        f.state?.toLowerCase() === org.hq_state?.toLowerCase(),
    );
    return (hqMatch ?? facilities[0]).id;
  }, [facilities, org.hq_city, org.hq_state]);

  const previewFacilities = filteredFacilities.slice(0, 6);
  const websiteDisplay = org.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null;

  const heroBg: React.CSSProperties = org.cover_image_url
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.55) 55%, rgba(15,23,42,0.3) 100%), url(${org.cover_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(105deg, ${brand} 0%, ${brand}dd 50%, ${org.accent_color ?? brand}44 100%)`,
      };

  const tabs: { id: OrgTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "facilities", label: "Facilities", count: facilities.length },
    { id: "services", label: "Services & Programs" },
    { id: "insurance", label: "Insurance" },
    { id: "accreditations", label: "Accreditations" },
    { id: "resources", label: "Resources" },
    { id: "reviews", label: "Reviews" },
  ];

  const hasContact = !!(heroContact && (heroContact.phone || heroContact.email));

  const sidebar = (
    <div className="space-y-5 lg:sticky lg:top-20">
      {heroContact ? (
        <OrgHeroContactCard
          contacts={[heroContact]}
          organizationId={org.id}
          brand={brand}
          heading="Your Contact"
        />
      ) : (
        <CardShell title="Your Contact">
          <OrgClaimCard organizationId={org.id} organizationName={org.name} />
        </CardShell>
      )}

      {hasInNetwork && (
        <CardShell title="Insurance">
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
              style={{ backgroundColor: `${brand}14`, color: brand }}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug">
                In-Network With {inNetworkPayers.length}+ Insurance Plans
              </p>
              <button
                type="button"
                onClick={() => setTab("insurance")}
                className="mt-1.5 text-xs font-semibold hover:underline"
                style={{ color: brand }}
              >
                View all in-network contracts →
              </button>
            </div>
          </div>
        </CardShell>
      )}

      {allLevels.length > 0 && (
        <CardShell title="Levels of Care Offered">
          <ul className="space-y-3">
            {allLevels.slice(0, 4).map((level) => {
              const Icon = levelIcon(level);
              return (
                <li key={level} className="flex items-start gap-2.5">
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center shrink-0"
                    style={{ backgroundColor: `${brand}14`, color: brand }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{level}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {levelDescription(level)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {allLevels.length > 4 && (
            <button
              type="button"
              onClick={() => setTab("services")}
              className="mt-3 text-xs font-semibold hover:underline"
              style={{ color: brand }}
            >
              View all services & programs →
            </button>
          )}
        </CardShell>
      )}

      {(org.why_refer.length > 0 || org.program_badges.length > 0) && (
        <CardShell title="Documents & Resources">
          <ul className="space-y-2.5">
            {org.why_refer.slice(0, 3).map((item) => (
              <li key={item.title} className="flex items-center gap-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0 truncate font-medium">{item.title}</span>
              </li>
            ))}
            {org.program_badges.slice(0, 3 - org.why_refer.length).map((badge) => (
              <li key={badge} className="flex items-center gap-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0 truncate font-medium">{badge}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setTab("resources")}
            className="mt-3 text-xs font-semibold hover:underline"
            style={{ color: brand }}
          >
            View all resources →
          </button>
        </CardShell>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-0", hasContact ? mobileContactBarPadding() : "")}>
      {/* Hero */}
      <section className="relative min-h-[280px] sm:min-h-[320px] flex flex-col justify-end overflow-hidden rounded-2xl border border-border/60 shadow-sm">
        <div className="absolute inset-0" style={heroBg} />
        {org.logo_url && (
          <div
            className="absolute inset-0 opacity-[0.06] bg-center bg-no-repeat bg-contain scale-150 pointer-events-none"
            style={{ backgroundImage: `url(${org.logo_url})` }}
          />
        )}

        {hasInNetwork && (
          <span
            className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: brand }}
          >
            In-Network
          </span>
        )}

        {org.verified && (
          <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span>Verified</span>
            {lastUpdated && (
              <>
                <span className="h-3 w-px bg-white/40" />
                <span className="font-medium text-white/85">Updated {lastUpdated}</span>
              </>
            )}
          </div>
        )}

        <div className="relative z-[1] px-5 sm:px-8 py-6 sm:py-8">
          <h1
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.12] text-white max-w-3xl"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
          >
            {org.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs sm:text-sm text-white/90">
            {primaryAccreditation && (
              <span className="inline-flex items-center gap-1">
                <Award className="h-3.5 w-3.5 shrink-0" />
                {primaryAccreditation}
              </span>
            )}
            {primaryAccreditation && loc && <span className="text-white/50">•</span>}
            {loc && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {loc}
              </span>
            )}
          </div>

          {hasInNetwork && (
            <p className="mt-2 text-xs sm:text-sm text-white/85 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              In-Network With Major Insurance
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-5">
            {org.slug && (
              <ShareSheetButton
                slug={org.slug}
                kind="org"
                label="Share Organization"
                hideCopy
                className="shadow-sm hover:opacity-90"
                style={{ backgroundColor: brand, borderColor: brand }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="mt-4 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border/60">
          {loc && <MetaColumn icon={MapPin} label="Headquarters" value={loc} brand={brand} />}
          {foundedYear && <MetaColumn icon={Calendar} label="Founded" value={foundedYear} brand={brand} />}
          {facilityType && <MetaColumn icon={Users} label="Facility Type" value={facilityType} brand={brand} />}
          {primaryAccreditation && (
            <MetaColumn icon={Award} label="Accreditation" value={primaryAccreditation} brand={brand} />
          )}
          {websiteDisplay && org.website && (
            <MetaColumn
              icon={Globe}
              label="Website"
              value={websiteDisplay}
              brand={brand}
              href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
            />
          )}
        </div>
      </section>

      {/* Content tabs */}
      <div className="mt-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/60">
        <div role="tablist" className="inline-flex items-center gap-0 min-w-max">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground border-transparent",
                )}
                style={active ? { borderColor: brand, color: brand } : undefined}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 ? ` (${tab.count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <div className="mt-6 grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start pb-8">
        <div className="min-w-0 space-y-6">
          {activeTab === "overview" && (
            <>
              {previewFacilities.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between gap-4 mb-4">
                    <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">Our Facilities</h2>
                    {facilities.length > previewFacilities.length && (
                      <button
                        type="button"
                        onClick={() => setTab("facilities")}
                        className="text-sm font-semibold hover:underline shrink-0"
                        style={{ color: brand }}
                      >
                        View all {facilities.length} locations →
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                    {previewFacilities.map((f) => (
                      <div key={f.id} className="snap-start">
                        <FacilityPreviewCard
                          facility={f}
                          orgSlug={org.slug}
                          brand={brand}
                          isMain={f.id === mainFacilityId}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight mb-4">
                  About {org.name}
                </h2>
                <div className="grid md:grid-cols-[1fr_auto] gap-6">
                  <div>
                    {(org.description || org.tagline) && (
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                        {org.description || org.tagline}
                      </p>
                    )}
                    {org.announcement && (
                      <p className="mt-3 text-sm leading-relaxed text-foreground/70 border-l-2 pl-3" style={{ borderColor: brand }}>
                        {org.announcement}
                      </p>
                    )}
                  </div>
                  {org.why_refer.length > 0 && (
                    <ul className="space-y-3 md:min-w-[200px]">
                      {org.why_refer.slice(0, 3).map((item) => (
                        <li key={item.title} className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: brand }} />
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.body}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === "facilities" && (
            <section className="space-y-4">
              <OrgStateFilter
                states={facilityStates}
                selected={selectedState}
                onSelect={onStateChange}
                brand={brand}
              />
              {filteredFacilities.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                  {facilities.length === 0
                    ? "No facilities published yet."
                    : "No facilities in this state."}
                </div>
              ) : (
                <OrgFacilityRail facilities={filteredFacilities} contracts={contracts} orgSlug={org.slug} />
              )}
            </section>
          )}

          {activeTab === "services" && (
            <section className="space-y-6">
              {allLevels.length > 0 && (
                <CardShell title="Levels of Care">
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {allLevels.map((level) => {
                      const Icon = levelIcon(level);
                      return (
                        <li key={level} className="flex items-start gap-3">
                          <div
                            className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
                            style={{ backgroundColor: `${brand}14`, color: brand }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{level}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{levelDescription(level)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardShell>
              )}
              {allPopulations.length > 0 && (
                <CardShell title="What We Treat">
                  <div className="flex flex-wrap gap-2">
                    {allPopulations.map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-md border border-border bg-background text-xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </CardShell>
              )}
              {allSpecializations.length > 0 && (
                <CardShell title="Program Features">
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {allSpecializations.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: brand }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardShell>
              )}
            </section>
          )}

          {activeTab === "insurance" && (
            <CardShell title="In-Network Insurance">
              {inNetworkPayers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {inNetworkPayers.map((payer) => (
                    <span
                      key={payer}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: brand }} />
                      {payer}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No in-network contracts published yet.</p>
              )}
            </CardShell>
          )}

          {activeTab === "accreditations" && (
            <CardShell title="Accreditations & Certifications">
              {allAccreditations.length > 0 ? (
                <ul className="space-y-3">
                  {allAccreditations.map((acc) => (
                    <li key={acc} className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
                        style={{ backgroundColor: `${brand}14`, color: brand }}
                      >
                        <Award className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">{acc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No accreditations listed yet.</p>
              )}
            </CardShell>
          )}

          {activeTab === "resources" && (
            <section className="space-y-4">
              {org.announcement && (
                <CardShell title="Announcement">
                  <p className="text-sm leading-relaxed text-foreground/80">{org.announcement}</p>
                </CardShell>
              )}
              {org.why_refer.length > 0 && (
                <CardShell title="Why Refer">
                  <ul className="space-y-4">
                    {org.why_refer.map((item) => (
                      <li key={item.title}>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                </CardShell>
              )}
              {org.program_badges.length > 0 && (
                <CardShell title="Program Highlights">
                  <div className="flex flex-wrap gap-2">
                    {org.program_badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: `${brand}14`, color: brand }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </CardShell>
              )}
              {!org.announcement && org.why_refer.length === 0 && org.program_badges.length === 0 && (
                <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                  No resources published yet.
                </div>
              )}
            </section>
          )}

          {activeTab === "reviews" && (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
              <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Reviews coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                Referral partner feedback will appear here in a future update.
              </p>
            </div>
          )}

          <OrgFooter
            orgId={org.id}
            orgName={org.name}
            slug={org.slug}
            logoUrl={org.logo_url}
            tagline={org.tagline}
            brand={brand}
          />
        </div>

        <aside className="hidden lg:block min-w-0">{sidebar}</aside>
      </div>

      {/* Mobile sidebar sections */}
      <div className="lg:hidden space-y-5 pb-8">{sidebar}</div>

      {hasContact && heroContact && (
        <MobileContactBar
          repName={heroContact.name}
          repPhone={heroContact.phone ?? null}
          repEmail={heroContact.email ?? null}
          brand={brand}
          organizationId={org.id}
          contextLabel={`Reach the BD rep at ${org.name}.`}
        />
      )}
    </div>
  );
}
