import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ShieldCheck, Globe, BadgeCheck } from "lucide-react";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { OrgFooter } from "@/components/public/OrgFooter";
import { OrgPageHeader } from "@/components/public/OrgPageHeader";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgMobileHero } from "@/components/public/OrgMobileHero";
import { applySocialMeta, orgShareCardType, orgShareImage } from "@/lib/social-meta";
import { ContractRow } from "@/lib/derive-insurance";
import { trackOrgEvent } from "@/lib/track-org-event";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";

interface Org {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  website: string | null;
  hq_city: string | null;
  hq_state: string | null;
  slug: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  brand_color: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  verified: boolean;
  updated_at?: string | null;
}

const DEFAULT_BRAND = "#1A73E8";
const DEFAULT_ACCENT = "#E0EDFF";

function isHex(v: string | null | undefined): v is string {
  return !!v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}

function uniqueFacilityStates(facilities: ShowcaseFacility[]) {
  const states = new Set<string>();
  for (const f of facilities) {
    const code = resolveStateCode(f.state);
    if (code) states.add(code);
  }
  return Array.from(states).sort((a, b) => stateDisplayName(a).localeCompare(stateDisplayName(b)));
}

export default function OrgSheet() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<Org | null>(null);
  const [facilities, setFacilities] = useState<ShowcaseFacility[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [extraContacts, setExtraContacts] = useState<HeroContact[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [selectedState, setSelectedState] = useState("all");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: o } = await supabase
        .from("organizations")
        .select(
          "id,name,logo_url,description,tagline,website,hq_city,hq_state,slug,bd_contact_name,bd_contact_phone,bd_contact_email,brand_color,accent_color,cover_image_url,verified,updated_at",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (!o) {
        setNotFound(true);
        return;
      }
      const orgData = o as unknown as Org;
      setOrg(orgData);
      trackOrgEvent(orgData.id, "page_view");
      const loc = [orgData.hq_city, orgData.hq_state].filter(Boolean).join(", ");
      applySocialMeta({
        title: orgData.name,
        description:
          orgData.tagline ||
          orgData.description ||
          `${orgData.name}${loc ? ` — ${loc}` : ""}. Referral profile.`,
        path: `/o/${orgData.slug ?? slug}`,
        image: orgShareImage(orgData),
        siteName: orgData.name,
        card: orgShareCardType(orgData),
      });

      const { data: f } = await supabase
        .from("facilities")
        .select(
          "id,name,slug,city,state,address_line1,zip,image_urls,levels_of_care,population_served,specializations,highlights,accreditations,short_description,description,tagline,insurance_status,featured_payer,updated_at",
        )
        .eq("organization_id", orgData.id)
        .eq("verification_status", "approved")
        .order("name");
      const facs = ((f as unknown) as ShowcaseFacility[]) ?? [];
      setFacilities(facs);

      if (facs.length > 0) {
        const { data: c } = await supabase
          .from("insurance_contracts")
          .select("facility_id,payer_name,in_network")
          .in(
            "facility_id",
            facs.map((x) => x.id),
          );
        setContracts(((c as unknown) as ContractRow[]) ?? []);
      }

      const { data: members } = await supabase
        .from("profiles")
        .select("full_name,job_title,phone,email")
        .eq("organization_id", orgData.id)
        .limit(4);
      if (members?.length) {
        const list = members
          .filter((m: { full_name?: string; phone?: string; email?: string }) => m.full_name && (m.phone || m.email))
          .map((m: { full_name: string; job_title?: string; phone?: string; email?: string }) => ({
            name: m.full_name,
            title: m.job_title,
            location: loc || null,
            phone: m.phone,
            email: m.email,
          })) as HeroContact[];
        setExtraContacts(list);
      }
    })();
  }, [slug]);

  const facilityStates = useMemo(() => uniqueFacilityStates(facilities), [facilities]);

  const filteredFacilities = useMemo(() => {
    if (selectedState === "all") return facilities;
    return facilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [facilities, selectedState]);

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground p-8 text-center">
        Organization not found.
      </div>
    );
  }
  if (!org) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  const brand = isHex(org.brand_color) ? org.brand_color : DEFAULT_BRAND;
  const accent = isHex(org.accent_color) ? org.accent_color : DEFAULT_ACCENT;
  const hasCover = !!org.cover_image_url;
  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const hasInNetwork = contracts.some((c) => c.in_network);

  const lastUpdatedAt = (() => {
    const stamps = [org.updated_at, ...facilities.map((f) => f.updated_at)]
      .filter((s): s is string => !!s)
      .map((s) => new Date(s).getTime())
      .filter((n) => Number.isFinite(n));
    return stamps.length ? new Date(Math.max(...stamps)) : null;
  })();
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const heroBg: React.CSSProperties = hasCover
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.62) 55%, rgba(15,23,42,0.35) 100%), url(${org.cover_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(105deg, ${brand} 0%, ${brand}dd 50%, ${accent} 100%)`,
      };

  const heroContacts: HeroContact[] = [];
  if (org.bd_contact_name && (org.bd_contact_phone || org.bd_contact_email)) {
    heroContacts.push({
      name: org.bd_contact_name,
      title: "Director of Business Development",
      location: loc || null,
      phone: org.bd_contact_phone,
      email: org.bd_contact_email,
    });
  }
  for (const c of extraContacts) {
    if (heroContacts.some((h) => h.email === c.email && h.email)) continue;
    if (heroContacts.some((h) => h.phone === c.phone && h.phone)) continue;
    if (heroContacts.length >= 1) break;
    heroContacts.push(c);
  }
  const limitedHeroContacts = heroContacts.slice(0, 1);
  const heroTitle = org.tagline || org.name;

  return (
    <div id="top" className="min-h-screen bg-muted/30">
      <OrgPageHeader orgName={org.name} logoUrl={org.logo_url} brand={brand} />

      {/* Mobile layout */}
      <OrgMobileHero
        org={org}
        facilities={facilities}
        brand={brand}
        heroContacts={limitedHeroContacts}
        facilityStates={facilityStates}
        selectedState={selectedState}
        onStateChange={setSelectedState}
        filteredFacilities={filteredFacilities}
        contracts={contracts}
      />

      {/* Desktop layout */}
      <main className="hidden sm:block max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 pb-12">
        {/* Hero: image + contact card side by side */}
        <section
          id="about"
          className="grid md:grid-cols-[1fr_minmax(280px,320px)] rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card"
        >
          {/* Hero image + heading — left column */}
          <div className="relative min-h-[240px] lg:min-h-[300px] flex flex-col justify-end border-b md:border-b-0 md:border-r border-border/50">
            <div className="absolute inset-0" style={heroBg} />
            {org.logo_url && (
              <div
                className="absolute inset-0 opacity-[0.07] bg-center bg-no-repeat bg-contain scale-150 pointer-events-none"
                style={{ backgroundImage: `url(${org.logo_url})` }}
              />
            )}
            {org.verified && (
              <div
                className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[10px] lg:text-[11px] font-semibold text-white shadow-sm"
                title={
                  lastUpdatedLabel
                    ? `Information last updated ${lastUpdatedLabel}`
                    : "Verified organization"
                }
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>Verified</span>
                {lastUpdatedLabel && (
                  <>
                    <span className="h-3 w-px bg-white/40" />
                    <span className="font-medium text-white/85">Updated {lastUpdatedLabel}</span>
                  </>
                )}
              </div>
            )}
            <div className="relative z-[1] px-5 lg:px-8 py-6 lg:py-8">
              <h1
                className="font-heading text-2xl lg:text-[2rem] xl:text-4xl font-bold tracking-tight leading-[1.12] text-white max-w-2xl"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
              >
                {heroTitle}
              </h1>
              {org.description && (
                <p
                  className="mt-3 text-sm lg:text-[15px] text-white/90 leading-relaxed max-w-xl line-clamp-3"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                >
                  {org.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/20 text-xs lg:text-sm text-white/90">
                {loc && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {loc}
                  </span>
                )}
                {hasInNetwork && (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    In-Network With Major Insurance
                  </span>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact card — right column */}
          <div className="flex items-start justify-center p-5 lg:p-6 bg-muted/20">
            {limitedHeroContacts.length > 0 ? (
              <OrgHeroContactCard contacts={limitedHeroContacts} organizationId={org.id} brand={brand} />
            ) : (
              <OrgClaimCard organizationId={org.id} organizationName={org.name} />
            )}
          </div>
        </section>

        {/* State filter */}
        <OrgStateFilter
          states={facilityStates}
          selected={selectedState}
          onSelect={setSelectedState}
          brand={brand}
        />

        {/* Facilities grid */}
        <section id="facilities" className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-xl lg:text-2xl font-bold tracking-tight">Our Facilities</h2>
            {filteredFacilities.length > 0 && (
              <span className="text-sm text-muted-foreground shrink-0">
                {filteredFacilities.length}{" "}
                {filteredFacilities.length === 1 ? "location" : "locations"}
              </span>
            )}
          </div>
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

        <OrgFooter
          orgId={org.id}
          orgName={org.name}
          slug={org.slug}
          logoUrl={org.logo_url}
          tagline={org.tagline}
          brand={brand}
        />
      </main>
    </div>
  );
}
