import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2,
  ExternalLink,
  AlertTriangle,
  Loader2,
  EyeOff,
} from "lucide-react";
import { VerificationBadge } from "@/components/app/search/VerificationBadge";
import {
  FacilitySheetView,
  SheetOrg,
  SheetContract,
} from "@/components/public/FacilitySheetView";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { AssignFacilityBdDialog } from "@/components/app/facility/AssignFacilityBdDialog";

interface Facility {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations: string[];
  capacity: number | null;
  image_urls: string[];
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  treatment_focus: string | null;
  short_description: string | null;
  insurance_status: string | null;
  featured_payer: string | null;
  quick_highlights: string[];
  updated_at: string | null;
  hidden_from_org_page?: boolean;
}
interface Contract {
  id: string;
  payer_name: string;
  in_network: boolean;
  payer_id: string | null;
  payer_status: "approved" | "pending" | "rejected" | null;
}

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile, isSuperAdmin, isFacilityAdmin } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [org, setOrg] = useState<SheetOrg | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [fixingSlug, setFixingSlug] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMine = !!facility && profile?.organization_id === facility.organization_id;
  const canManage = isSuperAdmin || (isMine && isFacilityAdmin);
  const canSeePending = isMine || isSuperAdmin;
  const canShare = isMine || isSuperAdmin;

  const loadFacility = async () => {
    if (!id) {
      setFacility(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: f, error } = await supabase.from("facilities").select("*").eq("id", id).maybeSingle();
    if (error) {
      toast.error(error.message || "Could not load facility");
    }
    const fac = (f as Facility | null) ?? null;
    setFacility(fac);
    if (fac) {
      const { data: o } = await supabase
        .from("organizations")
        .select("id,name,slug,logo_url,bd_contact_name,bd_contact_phone,bd_contact_email,website,brand_color,accent_color,cover_image_url")
        .eq("id", fac.organization_id)
        .maybeSingle();
      setOrg((o as SheetOrg | null) ?? null);
    } else {
      setOrg(null);
    }
    const { data: c } = await supabase
      .from("insurance_contracts")
      .select("id,payer_name,in_network,payer_id,payers(status)")
      .eq("facility_id", id);
    const list: Contract[] = ((c as Array<{ id: string; payer_name: string; in_network: boolean; payer_id: string | null; payers: { status: "approved" | "pending" | "rejected" } | null }>) ?? []).map((row) => ({
      id: row.id,
      payer_name: row.payer_name,
      in_network: row.in_network,
      payer_id: row.payer_id,
      payer_status: row.payers?.status ?? null,
    }));
    setContracts(list);
    setLoading(false);
  };

  const fixSlug = async () => {
    if (!facility) return;
    setFixingSlug(true);
    try {
      const { data: base, error: rpcErr } = await supabase.rpc("slugify", {
        _input: facility.name,
      });
      if (rpcErr) throw rpcErr;
      const cityPart = facility.city
        ? `-${await supabase.rpc("slugify", { _input: facility.city }).then((r) => r.data ?? "")}`
        : "";
      const hash = facility.id.slice(0, 6);
      const slug = `${base}${cityPart}-${hash}`;
      const { error: upErr } = await supabase
        .from("facilities")
        .update({ slug })
        .eq("id", facility.id);
      if (upErr) throw upErr;
      toast.success("Public link generated");
      loadFacility();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not generate link");
    } finally {
      setFixingSlug(false);
    }
  };

  useEffect(() => {
    loadFacility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!facility) {
    return <div className="py-20 text-center text-muted-foreground">Facility not found.</div>;
  }

  const sheetContracts: SheetContract[] = contracts
    .filter((c) => c.in_network && (c.payer_status !== "pending" || canSeePending))
    .map((c) => ({ id: c.id, payer_name: c.payer_name, in_network: c.in_network }));

  return (
    <div className="max-w-[1400px] mx-auto pb-8 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {org?.slug && (
          <Button asChild type="button" variant="outline" size="sm">
            <Link to={`/o/${org.slug}`}>
              <ExternalLink className="h-4 w-4" /> View Organization
            </Link>
          </Button>
        )}
        {(isMine || isSuperAdmin) && (
          <>
            <AssignFacilityBdDialog
              facilityId={facility.id}
              facilityName={facility.name}
              organizationId={facility.organization_id}
              bd_contact_name={facility.bd_contact_name}
              bd_contact_phone={facility.bd_contact_phone}
              bd_contact_email={facility.bd_contact_email}
              onSaved={loadFacility}
            />
            {canManage && (
              <EditFacilityDialog
                facility={facility}
                contracts={contracts.map((c) => ({
                  id: c.id,
                  payer_id: c.payer_id,
                  payer_name: c.payer_name,
                  in_network: c.in_network,
                }))}
                organizationId={facility.organization_id}
                onSaved={loadFacility}
              />
            )}
          </>
        )}
      </div>

      {!facility.slug && (isMine || isSuperAdmin) && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 text-sm p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-warning-foreground">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span>This facility doesn't have a public link yet — it can't be shared or found in search.</span>
          </div>
          <Button size="sm" variant="outline" onClick={fixSlug} disabled={fixingSlug} className="shrink-0">
            {fixingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate link"}
          </Button>
        </div>
      )}

      {facility.hidden_from_org_page && (isMine || isSuperAdmin) && (
        <div className="rounded-lg border border-border/70 bg-muted/40 text-sm p-3 flex items-center gap-2 text-muted-foreground">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            Hidden from your organization profile. Open <strong className="text-foreground">Edit Facility</strong> to
            show it again.
          </span>
        </div>
      )}

      {facility.rejection_reason && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
          <strong>Rejection reason:</strong> {facility.rejection_reason}
        </div>
      )}

      <FacilitySheetView
        facility={facility}
        org={org}
        contracts={sheetContracts}
        mode="internal"
        canShare={canShare}
        coverImageUrl={org?.cover_image_url ?? null}
        contractsHeaderExtra={
          <div className="flex items-center gap-2 flex-wrap">
            <VerificationBadge
              verifiedAt={facility.contracts_verified_at}
              frozen={facility.verification_frozen}
              size="sm"
            />
            {(isMine || isSuperAdmin) && (
              <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                <Link to={`/app/facilities/${facility.id}/verify`}>Verify now</Link>
              </Button>
            )}
          </div>
        }
      />


    </div>
  );
}
