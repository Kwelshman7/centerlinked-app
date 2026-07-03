import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, ShieldCheck, Globe, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgHeroLogo } from "@/components/public/OrgHeroLogo";
import { OrgMobileHero } from "@/components/public/OrgMobileHero";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { OrgFooter } from "@/components/public/OrgFooter";
import { GetInTouchSheet } from "@/components/public/GetInTouchSheet";
import { applySocialMeta, orgShareCardType, orgShareImage } from "@/lib/social-meta";
import { ContractRow } from "@/lib/derive-insurance";
import { trackOrgEvent } from "@/lib/track-org-event";

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

export default function OrgSheet() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, isSuperAdmin } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [facilities, setFacilities] = useState<ShowcaseFacility[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [extraContacts, setExtraContacts] = useState<HeroContact[]>([]);
  const [notFound, setNotFound] = useState(false);

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
      // Fire page-view analytics (skipped automatically for own-org members)
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

      // Best-effort fetch of org team members for the hero contact card
      const { data: members } = await supabase
        .from("profiles")
        .select("full_name,job_title,phone,email")
        .eq("organization_id", orgData.id)
        .limit(4);
      if (members?.length) {
        const list = members
          .filter((m: any) => m.full_name && (m.phone || m.email))
          .map((m: any) => ({
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
  const ctaPrimary = "Contact Admissions";
  const hasCover = !!org.cover_image_url;
  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const hasInNetwork = contracts.some((c) => c.in_network);

  // Most recent update across org and its facilities
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
        backgroundImage: `linear-gradient(95deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.55) 50%, rgba(15,23,42,0.25) 100%), url(${org.cover_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(95deg, ${brand} 0%, ${brand}cc 45%, ${accent} 100%)`,
      };

  // Hero contacts: org BD contact first, then team members (dedupe by email/phone)
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

  return (
    <div id="top" className="min-h-screen bg-muted/30">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
        {/* MOBILE HERO */}
        <OrgMobileHero org={org} facilities={facilities} brand={brand} />

        {/* HERO (tablet/desktop) */}
        <section
          id="about"
          className="relative overflow-hidden rounded-2xl border border-border/60 shadow-md hidden sm:block"
        >
          <div className="absolute inset-0" style={heroBg} />
          {org.verified && (
            <div
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm"
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
                  <span className="font-medium text-white/85">
                    Updated {lastUpdatedLabel}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
            {/* Top: editable logo + verified pill */}
            <OrgHeroLogo
              orgId={org.id}
              orgName={org.name}
              logoUrl={org.logo_url}
              tagline={org.tagline}
              verified={org.verified}
              canEdit={isSuperAdmin || profile?.organization_id === org.id}
              onLogoChange={(url) => setOrg((prev) => (prev ? { ...prev, logo_url: url } : prev))}
            />

            <div className="grid lg:grid-cols-[1fr_320px] gap-5 lg:gap-6 items-center">
              <div className="text-white max-w-xl">
                <h1
                  className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-[1.15]"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
                >
                  {org.tagline ? org.tagline : `${org.name}`}
                </h1>
                {org.description && (
                  <p
                    className="mt-2.5 text-xs sm:text-sm text-white/95 leading-relaxed line-clamp-3 sm:line-clamp-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                  >
                    {org.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] sm:text-xs text-white/95">
                  {loc && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {loc}
                    </span>
                  )}
                  {hasInNetwork && (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      In-Network With Major Insurance
                    </span>
                  )}
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              {limitedHeroContacts.length > 0 ? (
                <OrgHeroContactCard contacts={limitedHeroContacts} organizationId={org.id} brand={brand} />
              ) : (
                <OrgClaimCard organizationId={org.id} organizationName={org.name} />
              )}
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section id="facilities" className="space-y-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Our Facilities</h2>
          {facilities.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
              No facilities published yet.
            </div>
          ) : (
            <OrgFacilityRail facilities={facilities} contracts={contracts} orgSlug={org.slug} />
          )}
        </section>

        {/* Unified branded footer */}
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
