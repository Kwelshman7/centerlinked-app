import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { applySocialMeta, orgShareCardType, orgShareImage } from "@/lib/social-meta";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FacilitySheetView,
  FacilitySheetData,
  SheetOrg,
  SheetContract,
} from "@/components/public/FacilitySheetView";
import { OrgFooter } from "@/components/public/OrgFooter";
import { ProgramOrgHeader } from "@/components/public/ProgramOrgHeader";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { EditInsuranceContractsDialog } from "@/components/app/facility/EditInsuranceContractsDialog";
import { parseBrandColor, programDisplayPath, programPublicPath, programPublicUrl } from "@/lib/public-urls";
import { trackOrgEvent } from "@/lib/track-org-event";

interface Facility extends FacilitySheetData {
  organization_id: string;
  description: string | null;
  tagline: string | null;
  verification_status: string;
  phone?: string | null;
  website?: string | null;
  capacity?: number | null;
  highlights?: string[];
  accreditations?: string[];
}

interface OrgRow extends SheetOrg {
  cover_image_url?: string | null;
}

interface FullContract {
  id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

export default function ProgramSheet() {
  const { slug, orgSlug, programSlug } = useParams<{
    slug?: string;
    orgSlug?: string;
    programSlug?: string;
  }>();
  const navigate = useNavigate();
  const { profile, isSuperAdmin } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [fullContracts, setFullContracts] = useState<FullContract[]>([]);
  const [notFound, setNotFound] = useState(false);

  const facilitySlug = programSlug ?? slug ?? null;

  const canEdit =
    !!facility && (isSuperAdmin || profile?.organization_id === facility.organization_id);

  const contracts = useMemo<SheetContract[]>(
    () =>
      fullContracts
        .filter((r) => r.in_network)
        .map((row) => ({
          id: row.id,
          payer_name: row.payer_name,
          in_network: row.in_network,
          payer_logo_url: null,
        })),
    [fullContracts],
  );

  const brand = parseBrandColor(org?.brand_color);
  const sharePath =
    facility?.slug && org?.slug
      ? programPublicPath(facility.slug, org.slug)
      : facility?.slug
        ? programPublicPath(facility.slug)
        : null;

  const loadAll = async () => {
    if (!facilitySlug) return;
    const { data: f } = await supabase
      .from("facilities")
      .select(
        "id,organization_id,name,slug,description,tagline,short_description,address_line1,city,state,zip,phone,website,capacity,highlights,quick_highlights,accreditations,image_urls,levels_of_care,population_served,specializations,treatment_focus,insurance_status,bd_contact_name,bd_contact_phone,bd_contact_email,verification_status,created_at,updated_at",
      )
      .eq("slug", facilitySlug)
      .eq("verification_status", "approved")
      .maybeSingle();

    if (!f) {
      setNotFound(true);
      return;
    }

    const fac = f as Facility;
    const [{ data: o }, { data: c }] = await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id,name,logo_url,slug,bd_contact_name,bd_contact_phone,bd_contact_email,tagline,brand_color,accent_color,cover_image_url",
        )
        .eq("id", fac.organization_id)
        .maybeSingle(),
      supabase
        .from("insurance_contracts")
        .select("id,payer_id,payer_name,in_network")
        .eq("facility_id", fac.id)
        .order("payer_name"),
    ]);

    const orgRow = (o as OrgRow | null) ?? null;

    if (orgSlug && orgRow?.slug && orgRow.slug !== orgSlug) {
      setNotFound(true);
      return;
    }

    setFacility(fac);
    setOrg(orgRow);
    setFullContracts((c as FullContract[]) ?? []);

    if (orgRow?.id) {
      trackOrgEvent(orgRow.id, "page_view");
    }

    const loc = [fac.city, fac.state].filter(Boolean).join(", ");
    const canonicalPath = programPublicPath(fac.slug ?? facilitySlug, orgRow?.slug);
    applySocialMeta({
      title: `${fac.name} — ${orgRow?.name ?? "Program"}`,
      description:
        fac.description ||
        fac.tagline ||
        orgRow?.tagline ||
        `${fac.name}${loc ? ` in ${loc}` : ""}. Program sheet.`,
      path: canonicalPath,
      image: orgRow ? orgShareImage(orgRow) : fac.image_urls?.[0] ?? null,
      siteName: orgRow?.name ?? undefined,
      card: orgRow ? orgShareCardType(orgRow) : "summary_large_image",
    });

    // Canonical branded URL when visiting legacy /p/:slug
    if (!orgSlug && orgRow?.slug && fac.slug && typeof window !== "undefined") {
      const branded = programPublicPath(fac.slug, orgRow.slug);
      if (window.location.pathname !== branded) {
        navigate(branded, { replace: true });
      }
    }
  };

  useEffect(() => {
    setNotFound(false);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilitySlug, orgSlug]);

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-8">
        <div>
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-bold">Program sheet not found</h1>
          <p className="text-muted-foreground mt-2">
            This link may have been rotated or the facility is not yet verified.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Back to CenterLinked</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!facility) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  const shareUrl =
    sharePath && typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath
        ? programPublicUrl("https://centerlinked.com", facility.slug!, org?.slug)
        : undefined;

  return (
    <div className="min-h-screen bg-muted/30">
      {org ? (
        <ProgramOrgHeader org={org} facilityName={facility.name} brand={brand} />
      ) : (
        <header className="bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <span className="font-heading font-bold">{facility.name}</span>
            <Button asChild size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </header>
      )}

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        <FacilitySheetView
          facility={facility}
          org={org}
          contracts={contracts}
          mode="public"
          canShare={canEdit}
          canEditPhotos={canEdit}
          onPhotosUpdated={loadAll}
          brandColor={brand}
          coverImageUrl={org?.cover_image_url ?? null}
          aboutHeaderExtra={
            canEdit ? (
              <EditFacilityDialog
                facility={{
                  id: facility.id,
                  name: facility.name,
                  tagline: facility.tagline,
                  address_line1: facility.address_line1,
                  city: facility.city,
                  state: facility.state,
                  zip: facility.zip,
                  phone: facility.phone ?? null,
                  website: facility.website ?? null,
                  description: facility.description,
                  capacity: facility.capacity ?? null,
                  levels_of_care: facility.levels_of_care ?? [],
                  highlights: facility.highlights ?? [],
                  population_served: facility.population_served ?? [],
                  specializations: facility.specializations ?? [],
                  accreditations: facility.accreditations ?? [],
                  image_urls: facility.image_urls ?? [],
                  bd_contact_name: facility.bd_contact_name,
                  bd_contact_phone: facility.bd_contact_phone,
                  bd_contact_email: facility.bd_contact_email,
                }}
                contracts={fullContracts.map((c) => ({
                  id: c.id,
                  payer_id: c.payer_id,
                  payer_name: c.payer_name,
                  in_network: c.in_network,
                }))}
                onSaved={loadAll}
              />
            ) : null
          }
          contractsHeaderExtra={
            canEdit ? (
              <EditInsuranceContractsDialog
                facilityId={facility.id}
                contracts={fullContracts.map((c) => ({
                  id: c.id,
                  payer_id: c.payer_id,
                  payer_name: c.payer_name,
                  in_network: c.in_network,
                  pending: false,
                }))}
                onSaved={loadAll}
              />
            ) : null
          }
        />

        <OrgFooter
          orgId={org?.id ?? facility.organization_id}
          orgName={org?.name ?? "This organization"}
          slug={org?.slug ?? null}
          logoUrl={org?.logo_url ?? null}
          tagline={org?.tagline ?? null}
          brand={brand}
          shareUrl={shareUrl}
          shareDisplayPath={
            facility.slug && org?.slug
              ? programDisplayPath(facility.slug, org.slug)
              : undefined
          }
          shareTitle={`${facility.name} — ${org?.name ?? "Program"}`}
          shareLabel="Share this program"
          orgLinkLabel="View all programs"
        />
      </main>
    </div>
  );
}
