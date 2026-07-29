import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OrgAppHeader } from "@/components/public/OrgAppHeader";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrganizationSheetView, OrgSheetData } from "@/components/public/OrganizationSheetView";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { applySocialMeta, orgShareCardType, orgShareImage } from "@/lib/social-meta";
import { trackOrgEvent } from "@/lib/track-org-event";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import { useOrgBrandColor } from "@/hooks/useOrgBrandColor";

function uniqueFacilityStates(facilities: ShowcaseFacility[]) {
  const states = new Set<string>();
  for (const f of facilities) {
    const code = resolveStateCode(f.state);
    if (code) states.add(code);
  }
  return Array.from(states).sort((a, b) => stateDisplayName(a).localeCompare(stateDisplayName(b)));
}

function uniqueFacilityLevels(facilities: ShowcaseFacility[]) {
  const levels = new Set<string>();
  for (const f of facilities) {
    for (const level of f.levels_of_care ?? []) {
      const trimmed = level?.trim();
      if (trimmed) levels.add(trimmed);
    }
  }
  return Array.from(levels).sort((a, b) => a.localeCompare(b));
}

function parseWhyRefer(raw: unknown): { title: string; body: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is { title: string; body: string } =>
      !!x && typeof x === "object" && "title" in x && "body" in x,
  );
}

export default function OrgSheet() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<OrgSheetData | null>(null);
  const [facilities, setFacilities] = useState<ShowcaseFacility[]>([]);
  const [heroContact, setHeroContact] = useState<HeroContact | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedState, setSelectedState] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    setSelectedLevel("all");
  }, [selectedState]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: o } = await supabase
        .from("organizations")
        .select(
          "id,name,logo_url,description,tagline,website,hq_city,hq_state,slug,bd_contact_name,bd_contact_phone,bd_contact_email,brand_color,accent_color,cover_image_url,image_urls,verified,created_at,updated_at,program_badges,announcement,why_refer",
        )
        .eq("slug", slug)
        .maybeSingle();

      if (!o) {
        setNotFound(true);
        return;
      }

      const orgData: OrgSheetData = {
        ...(o as Omit<OrgSheetData, "program_badges" | "why_refer">),
        program_badges: ((o as { program_badges?: string[] | null }).program_badges) ?? [],
        why_refer: parseWhyRefer((o as { why_refer?: unknown }).why_refer),
      };
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

      if (orgData.bd_contact_name && (orgData.bd_contact_phone || orgData.bd_contact_email)) {
        setHeroContact({
          name: orgData.bd_contact_name,
          title: "Director of Business Development",
          location: loc || null,
          phone: orgData.bd_contact_phone,
          email: orgData.bd_contact_email,
        });
        return;
      }

      const { data: members } = await supabase
        .from("profiles")
        .select("full_name,job_title,phone,email")
        .eq("organization_id", orgData.id)
        .limit(4);

      if (members?.length) {
        const member = members.find(
          (m: { full_name?: string; phone?: string; email?: string }) =>
            m.full_name && (m.phone || m.email),
        ) as { full_name: string; job_title?: string; phone?: string; email?: string } | undefined;

        if (member) {
          setHeroContact({
            name: member.full_name,
            title: member.job_title ?? "BD Representative",
            location: loc || null,
            phone: member.phone ?? null,
            email: member.email ?? null,
          });
        }
      }
    })();
  }, [slug]);

  const brand = useOrgBrandColor(org);
  const facilityStates = useMemo(() => uniqueFacilityStates(facilities), [facilities]);
  const facilityLevels = useMemo(() => uniqueFacilityLevels(facilities), [facilities]);

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

  const briefDescription = org.description?.trim() || null;

  const contactAside = heroContact ? (
    <OrgHeroContactCard
      contacts={[heroContact]}
      organizationId={org.id}
      brand={brand}
      heading="For Referrals"
      website={org.website}
      variant="default"
      className="w-full"
    />
  ) : (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm p-1">
      <OrgClaimCard organizationId={org.id} organizationName={org.name} />
    </div>
  );

  return (
    <div
      id="top"
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.35) 100%)`,
      }}
    >
      <OrgAppHeader brand={brand} />

      {/* Mobile: logo sits cleanly under the header, full-bleed */}
      <div className="lg:hidden">
        <OrgHeroSection org={org} brand={brand} compact />
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-7 lg:py-9 space-y-5 sm:space-y-8">
        {/* Desktop: professional heading + contact card */}
        <div className="hidden lg:block">
          <OrgHeroSection
            org={org}
            brand={brand}
            description={briefDescription}
            facilityCount={facilities.length}
            contactAside={contactAside}
          />
        </div>

        <OrganizationSheetView
          org={org}
          facilities={facilities}
          heroContact={heroContact}
          brand={brand}
          facilityStates={facilityStates}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          facilityLevels={facilityLevels}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          description={briefDescription}
        />
      </main>
    </div>
  );
}
