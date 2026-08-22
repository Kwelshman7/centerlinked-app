import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrganizationSheetView, OrgSheetData } from "@/components/public/OrganizationSheetView";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { Button } from "@/components/ui/button";
import { applySocialMeta, orgShareCardType, orgShareIcon, orgShareImage } from "@/lib/social-meta";
import { trackOrgEvent } from "@/lib/track-org-event";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import { useOrgBrandColor } from "@/hooks/useOrgBrandColor";
import { fetchPublicOrgSheet } from "@/lib/public-sheet-data";
import { orgPublicUrl } from "@/lib/public-urls";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

export default function OrgSheet() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, isSuperAdmin } = useAuth();
  const [org, setOrg] = useState<OrgSheetData | null>(null);
  const [facilities, setFacilities] = useState<ShowcaseFacility[]>([]);
  const [facilityPayersById, setFacilityPayersById] = useState<Map<string, string[]>>(new Map());
  const [heroContact, setHeroContact] = useState<HeroContact | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ownPending, setOwnPending] = useState(false);
  const [selectedState, setSelectedState] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedInsurance, setSelectedInsurance] = useState("all");

  useEffect(() => {
    setSelectedLevel("all");
  }, [selectedState]);

  useEffect(() => {
    setSelectedInsurance("all");
  }, [selectedState, selectedLevel]);

  useEffect(() => {
    if (!slug) return;
    setNotFound(false);
    setOwnPending(false);
    setOrg(null);
    (async () => {
      const payload = await fetchPublicOrgSheet(slug);
      if (!payload) {
        const { data: own } = await supabase
          .from("organizations")
          .select("id,verified")
          .eq("slug", slug)
          .maybeSingle();
        const isOwnPending =
          !!own &&
          own.verified !== true &&
          (isSuperAdmin || profile?.organization_id === own.id);
        setOwnPending(isOwnPending);
        setNotFound(!isOwnPending);
        return;
      }

      const orgData = payload.org;
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
        icon: orgShareIcon(orgData),
        siteName: orgData.name,
        card: orgShareCardType(orgData),
        imageAlt: `${orgData.name} logo`,
        imageWidth: 1200,
        imageHeight: 630,
      });

      setFacilities(payload.facilities);

      const map = new Map<string, string[]>();
      for (const row of payload.contracts) {
        const name = row.payer_name?.trim();
        if (!name) continue;
        const list = map.get(row.facility_id) ?? [];
        if (!list.includes(name)) list.push(name);
        map.set(row.facility_id, list);
      }
      for (const [id, names] of map) {
        map.set(
          id,
          names.sort((a, b) => a.localeCompare(b)),
        );
      }
      setFacilityPayersById(map);

      if (orgData.bd_contact_name && (orgData.bd_contact_phone || orgData.bd_contact_email)) {
        setHeroContact({
          name: orgData.bd_contact_name,
          title: "Director of Business Development",
          location: loc || null,
          phone: orgData.bd_contact_phone,
          email: orgData.bd_contact_email,
        });
      } else {
        setHeroContact(null);
      }
    })();
  }, [slug, profile?.organization_id, isSuperAdmin]);

  const brand = useOrgBrandColor(org);
  const facilityStates = useMemo(() => uniqueFacilityStates(facilities), [facilities]);
  const facilityLevels = useMemo(() => uniqueFacilityLevels(facilities), [facilities]);
  const facilityInsurers = useMemo(() => {
    const names = new Set<string>();
    for (const f of facilities) {
      for (const name of facilityPayersById.get(f.id) ?? []) {
        names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [facilities, facilityPayersById]);
  const verifiedAt = useMemo(() => {
    let latest: string | null = null;
    for (const f of facilities) {
      const d = f.contracts_verified_at?.trim();
      if (d && (!latest || d > latest)) latest = d;
    }
    return latest ?? org?.updated_at ?? null;
  }, [facilities, org?.updated_at]);

  const handleExportPdf = useCallback(async () => {
    if (!org) return;
    const toastId = toast.loading("Creating your referral overview…");
    try {
      const { exportOrgOnePagerPdf } = await import("@/lib/export-org-one-pager");
      const profileUrl =
        org.slug && typeof window !== "undefined"
          ? orgPublicUrl(window.location.origin, org.slug)
          : null;
      await exportOrgOnePagerPdf({
        org,
        facilities,
        facilityPayersById,
        brandColor: brand,
        profileUrl,
      });
      trackOrgEvent(org.id, "share_click");
      toast.success("Referral overview PDF downloaded", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the PDF. Please try again.", { id: toastId });
    }
  }, [org, facilities, facilityPayersById, brand]);

  if (ownPending || notFound) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-8">
        <div>
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-bold">
            {ownPending ? "Public page isn’t live yet" : "Organization not found"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {ownPending
              ? "This organization is still pending review. Referral partners won’t see the page until it’s approved."
              : "This link may have been rotated, or the organization isn’t public yet."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            {ownPending && (
              <Button asChild>
                <Link to="/app">Back to Home</Link>
              </Button>
            )}
            <Button asChild variant={ownPending ? "outline" : "default"}>
              <Link to="/">Back to CenterLinked</Link>
            </Button>
          </div>
        </div>
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
      size="lg"
      className="w-full"
    />
  ) : (
    <div className="rounded-2xl border border-border/60 bg-card shadow-lg p-1">
      <OrgClaimCard organizationId={org.id} organizationName={org.name} />
    </div>
  );

  return (
    <div id="top" className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile: logo-on-top strip — matches landing PublicOrgSheetPreview */}
      <div className="lg:hidden">
        <OrgHeroSection
          org={org}
          brand={brand}
          compact
          parts="media"
          verifiedAt={verifiedAt}
        />
      </div>

      {/* Desktop: identity band + contact card */}
      <div className="hidden lg:block">
        <OrgHeroSection
          org={org}
          brand={brand}
          description={briefDescription}
          facilityCount={facilities.length}
          verifiedAt={verifiedAt}
          contactAside={contactAside}
        />
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:pt-3 lg:pb-8 space-y-4 sm:space-y-5">
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
          facilityInsurers={facilityInsurers}
          selectedInsurance={selectedInsurance}
          onInsuranceChange={setSelectedInsurance}
          facilityPayersById={facilityPayersById}
          description={briefDescription}
          verifiedAt={verifiedAt}
          showExportPdf
          onExportPdf={handleExportPdf}
        />
      </main>
    </div>
  );
}
