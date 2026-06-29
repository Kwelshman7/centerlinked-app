import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { applySocialMeta } from "@/lib/social-meta";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FacilitySheetView,
  FacilitySheetData,
  SheetOrg,
  SheetContract,
} from "@/components/public/FacilitySheetView";
import { OrgFooter } from "@/components/public/OrgFooter";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { EditInsuranceContractsDialog } from "@/components/app/facility/EditInsuranceContractsDialog";

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

interface FullContract {
  id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

export default function ProgramSheet() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, isSuperAdmin } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [org, setOrg] = useState<SheetOrg | null>(null);
  const [contracts, setContracts] = useState<SheetContract[]>([]);
  const [fullContracts, setFullContracts] = useState<FullContract[]>([]);
  const [notFound, setNotFound] = useState(false);
  const canEdit =
    !!facility && (isSuperAdmin || profile?.organization_id === facility.organization_id);
  const canShare = canEdit;

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const loadAll = async () => {
    if (!slug) return;
    const { data: f } = await supabase
      .from("facilities")
      .select(
        "id,organization_id,name,slug,description,tagline,address_line1,city,state,zip,phone,website,capacity,highlights,accreditations,image_urls,levels_of_care,population_served,specializations,bd_contact_name,bd_contact_phone,bd_contact_email,verification_status,updated_at",
      )
      .eq("slug", slug)
      .eq("verification_status", "approved")
      .maybeSingle();
    if (!f) {
      setNotFound(true);
      return;
    }
    setFacility(f as Facility);
    const fac = f as Facility;
    const [{ data: o }, { data: c }] = await Promise.all([
      supabase
        .from("organizations")
        .select("id,name,logo_url,slug,bd_contact_name,bd_contact_phone,bd_contact_email,tagline,brand_color,accent_color")
        .eq("id", fac.organization_id)
        .maybeSingle(),
      supabase
        .from("insurance_contracts")
        .select("id,payer_id,payer_name,in_network")
        .eq("facility_id", fac.id)
        .order("payer_name"),
    ]);
    setOrg((o as SheetOrg | null) ?? null);
    const rows = (c as FullContract[]) ?? [];
    setFullContracts(rows);
    const list: SheetContract[] = rows
      .filter((r) => r.in_network)
      .map((row) => ({
        id: row.id,
        payer_name: row.payer_name,
        in_network: row.in_network,
        payer_logo_url: null,
      }));
    setContracts(list);
    const orgRow = o as SheetOrg | null;
    const loc = [fac.city, fac.state].filter(Boolean).join(", ");
    applySocialMeta({
      title: `${fac.name}${orgRow?.name ? ` — ${orgRow.name}` : ""} · CenterLinked`,
      description:
        fac.description ||
        fac.tagline ||
        `${fac.name}${loc ? ` in ${loc}` : ""}. Program sheet on CenterLinked.`,
      path: `/p/${fac.slug ?? slug}`,
      image: fac.image_urls?.[0] ?? orgRow?.logo_url ?? null,
    });
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);


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
  if (!facility)
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-slate-900 text-white border-b border-slate-800 print:hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Logo to="/" size="md" />
          <Button asChild size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">

        <FacilitySheetView
          facility={facility}
          org={org}
          contracts={contracts}
          mode="public"
          canShare={canShare}
          canEditPhotos={canEdit}
          onPhotosUpdated={loadAll}
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
          brand={
            org?.brand_color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(org.brand_color)
              ? org.brand_color
              : "#1A73E8"
          }
        />
      </main>
    </div>
  );
}
