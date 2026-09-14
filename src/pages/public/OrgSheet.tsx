import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2, FileText, Share2, User } from "lucide-react";
import { SearchContextBar } from "@/components/app/search/SearchContextBar";
import { ProgramOrgHeader } from "@/components/public/ProgramOrgHeader";
import { ClaimOrganizationDialog } from "@/components/ClaimOrganizationDialog";
import { OrganizationSheetView, OrgSheetData } from "@/components/public/OrganizationSheetView";
import { type HeroContact } from "@/components/public/OrgHeroContactCard";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { Button } from "@/components/ui/button";
import { applySocialMeta, orgShareCardType, orgShareIcon, orgShareImage } from "@/lib/social-meta";
import { trackOrgEvent } from "@/lib/track-org-event";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import { useOrgBrandColor } from "@/hooks/useOrgBrandColor";
import { fetchPublicOrgSheet } from "@/lib/public-sheet-data";
import { orgPublicUrl, programPublicPath } from "@/lib/public-urls";
import {
  FOOTER_ACTION_BTN_CLASS,
  FOOTER_ACTION_ICON_CLASS,
  footerActionButtonStyle,
  openReferPatientSheet,
} from "@/lib/org-shared-footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { loadPublicReferralContacts } from "@/lib/load-public-referral-contacts";

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
        // Visibility is is_published, not verified — an unclaimed profile can be
        // publicly live while still carrying no verification claim.
        const { data: own } = await supabase
          .from("organizations")
          .select("id,is_published")
          .eq("slug", slug)
          .maybeSingle();
        const isOwnPending =
          !!own &&
          own.is_published !== true &&
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

      const publicContacts = await loadPublicReferralContacts(orgData.id);
      const featured = publicContacts[0];
      if (featured) {
        setHeroContact({
          name: featured.name,
          title: featured.title || "Director of Business Development",
          location: loc || null,
          phone: featured.phone,
          email: featured.email,
          avatar_url: featured.avatar_url,
          user_id: featured.user_id,
        });
      } else if (orgData.bd_contact_name && (orgData.bd_contact_phone || orgData.bd_contact_email)) {
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
  const onlyFacility = facilities.length === 1 ? facilities[0] : null;
  if (onlyFacility?.slug && org.slug) {
    return <Navigate to={programPublicPath(onlyFacility.slug, org.slug)} replace />;
  }

  const actionStyle = footerActionButtonStyle(brand);
  const shareUrl =
    org.slug && typeof window !== "undefined"
      ? orgPublicUrl(window.location.origin, org.slug)
      : org.slug
        ? `https://www.centerlinked.com/o/${org.slug}`
        : "";

  return (
    <div id="top" className="min-h-screen bg-background overflow-x-hidden">
      <SearchContextBar currentOrgSlug={org.slug} />
      <ProgramOrgHeader org={org} brand={brand} logoHref={null}>
        {heroContact ? (
          <button
            type="button"
            onClick={() => openReferPatientSheet()}
            className={FOOTER_ACTION_BTN_CLASS}
            style={actionStyle}
          >
            <User className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
            Refer Patient
          </button>
        ) : null}
        {shareUrl ? (
          <button
            type="button"
            className={FOOTER_ACTION_BTN_CLASS}
            style={actionStyle}
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({ title: org.name, url: shareUrl });
                } else {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied");
                }
                trackOrgEvent(org.id, "share_click");
              } catch {
                /* user cancelled share */
              }
            }}
          >
            <Share2 className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
            Share Link
          </button>
        ) : null}
        <button
          type="button"
          className={FOOTER_ACTION_BTN_CLASS}
          style={actionStyle}
          onClick={() => void handleExportPdf()}
        >
          <FileText className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
          Export PDF
        </button>
        {!org.verified ? (
          <ClaimOrganizationDialog
            organizationId={org.id}
            organizationName={org.name}
            triggerLabel="Claim"
            triggerClassName={FOOTER_ACTION_BTN_CLASS}
            triggerStyle={actionStyle}
          />
        ) : null}
      </ProgramOrgHeader>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-3 pb-0 space-y-4 sm:space-y-5">
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
