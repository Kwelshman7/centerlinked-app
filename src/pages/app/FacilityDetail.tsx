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
import {
  FacilitySheetView,
  SheetOrg,
  SheetContract,
} from "@/components/public/FacilitySheetView";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { AssignFacilityBdDialog } from "@/components/app/facility/AssignFacilityBdDialog";
import { ShareSheetButton } from "@/components/app/ShareSheetButton";
import { listFacilityBdAssignments } from "@/lib/admin-bd";
import { Card } from "@/components/ui/card";
import { BdContactLine } from "@/components/app/search/BdContactLine";
import { isOutOfNetworkOnlyFacility } from "@/lib/insurance-contract-status";

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
  bd_contact_title?: string | null;
  bd_contact_verified_at?: string | null;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  treatment_focus: string | null;
  short_description: string | null;
  insurance_status: string | null;
  featured_payer: string | null;
  quick_highlights: string[];
  updated_at: string | null;
  hidden_from_org_page?: boolean;
  self_pay_only?: boolean | null;
}
interface ExtraRep {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  availability_status: string | null;
  territory: string | null;
}

interface Contract {
  id: string;
  payer_name: string;
  in_network: boolean;
  payer_id: string | null;
  payer_status: "approved" | "pending" | "rejected" | null;
  plan_types: string[];
}

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile, isSuperAdmin } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [org, setOrg] = useState<SheetOrg | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoadFailed, setContractsLoadFailed] = useState(false);
  const [extraReps, setExtraReps] = useState<ExtraRep[]>([]);
  const [fixingSlug, setFixingSlug] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMine = !!facility && profile?.organization_id === facility.organization_id;
  const canManage = isSuperAdmin || isMine;
  const canSeePending = isMine || isSuperAdmin;
  const orgPublicLive = org?.verified === true && !!org?.slug;
  const facilityPublicLive =
    facility?.verification_status === "approved" && !facility?.verification_frozen && !!facility?.slug;

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
        .select("id,name,slug,logo_url,bd_contact_name,bd_contact_phone,bd_contact_email,website,brand_color,accent_color,cover_image_url,verified")
        .eq("id", fac.organization_id)
        .maybeSingle();
      setOrg((o as SheetOrg | null) ?? null);
    } else {
      setOrg(null);
    }
    const { data: c, error: contractsError } = await supabase
      .from("insurance_contracts")
      .select("id,payer_name,in_network,payer_id,plan_types")
      .eq("facility_id", id);
    if (contractsError) {
      setContractsLoadFailed(true);
      toast.error("Could not load insurance contracts", { description: contractsError.message });
    } else {
      setContractsLoadFailed(false);
    }
    const contractRows = (c as Array<{
      id: string;
      payer_name: string;
      in_network: boolean;
      payer_id: string | null;
      plan_types?: string[] | null;
    }>) ?? [];
    const payerIds = [...new Set(contractRows.map((row) => row.payer_id).filter((id): id is string => Boolean(id)))];
    const statusByPayer = new Map<string, Contract["payer_status"]>();
    if (payerIds.length) {
      const { data: payerRows } = await supabase.from("payers").select("id,status").in("id", payerIds);
      for (const payer of payerRows ?? []) {
        statusByPayer.set(payer.id, payer.status);
      }
    }
    const list: Contract[] = contractRows.map((row) => ({
      id: row.id,
      payer_name: row.payer_name,
      in_network: row.in_network,
      payer_id: row.payer_id,
      payer_status: (row.payer_id && statusByPayer.get(row.payer_id)) || null,
      plan_types: row.plan_types ?? [],
    }));
    setContracts(list);
    const { data: assignments } = await listFacilityBdAssignments(id);
    const extras: ExtraRep[] = [];
    for (const row of assignments ?? []) {
      if (row.is_primary) continue;
      const rep = Array.isArray(row.bd_representatives)
        ? row.bd_representatives[0]
        : row.bd_representatives;
      if (!rep || typeof rep !== "object" || !("full_name" in rep)) continue;
      extras.push({
        id: row.id,
        full_name: String(rep.full_name ?? ""),
        title: "title" in rep ? (rep.title as string | null) : null,
        email: "email" in rep ? (rep.email as string | null) : null,
        phone: "phone" in rep ? (rep.phone as string | null) : null,
        availability_status:
          "availability_status" in rep ? (rep.availability_status as string | null) : null,
        territory: "territory" in rep ? (rep.territory as string | null) : null,
      });
    }
    setExtraReps(extras);
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
    .map((c) => ({
      id: c.id,
      payer_name: c.payer_name,
      in_network: c.in_network,
      plan_types: c.plan_types ?? [],
    }));

  const actionClass = "w-full justify-center min-w-0 sm:w-auto";

  return (
    <div className="max-w-[1400px] mx-auto pb-8 space-y-5 sm:space-y-6 min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        {org?.slug && orgPublicLive ? (
          <Button asChild type="button" variant="outline" size="sm" className={actionClass}>
            <Link to={`/o/${org.slug}`}>
              <ExternalLink className="h-4 w-4" /> View Organization
            </Link>
          </Button>
        ) : org?.slug && (isMine || isSuperAdmin) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionClass}
            onClick={() =>
              toast.message("Public page isn’t live yet", {
                description: "It goes live after CenterLinked approves the organization.",
              })
            }
          >
            <ExternalLink className="h-4 w-4" /> View Organization
          </Button>
        ) : null}
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
              triggerClassName={actionClass}
            />
            {canManage && (
              <EditFacilityDialog
                facility={facility}
                contracts={contracts.map((c) => ({
                  id: c.id,
                  payer_id: c.payer_id,
                  payer_name: c.payer_name,
                  in_network: c.in_network,
                  plan_types: c.plan_types ?? [],
                }))}
                organizationId={facility.organization_id}
                contractsLoadFailed={contractsLoadFailed}
                onSaved={loadFacility}
                triggerClassName={actionClass}
              />
            )}
            {facility.slug && facilityPublicLive ? (
              <ShareSheetButton
                slug={facility.slug}
                orgSlug={org?.slug}
                kind="facility"
                variant="default"
                size="sm"
                label="Share Facility"
                hideCopy
                className={actionClass}
              />
            ) : facility.slug ? (
              <Button
                type="button"
                size="sm"
                className={actionClass}
                onClick={() =>
                  toast.message("Facility isn’t public yet", {
                    description: "Share becomes available after this facility is approved.",
                  })
                }
              >
                Share Facility
              </Button>
            ) : null}
          </>
        )}
      </div>

      {facility.verification_status === "pending" && (isMine || isSuperAdmin) && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 text-sm p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-warning-foreground">
            Pending review — this program is not in partner Search yet.
            {contractsLoadFailed
              ? " Retry loading insurance below, then add payers."
              : " Use Edit Facility to add or change insurance anytime."}
          </p>
        </div>
      )}

      {canManage && contractsLoadFailed && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-sm p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-muted-foreground">
            Insurance didn't load. Retry before adding payers so existing contracts are not overwritten.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadFacility()}>
            Retry insurance
          </Button>
        </div>
      )}

      {canManage && !contractsLoadFailed && contracts.filter((c) => c.in_network).length === 0 && (
        <div className="rounded-lg border border-border/70 bg-card text-sm p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-muted-foreground">
            No in-network insurance yet. Partners search by who accepts what — add payers now.
          </p>
          <EditFacilityDialog
            facility={facility}
            contracts={contracts.map((c) => ({
              id: c.id,
              payer_id: c.payer_id,
              payer_name: c.payer_name,
              in_network: c.in_network,
              plan_types: c.plan_types ?? [],
            }))}
            organizationId={facility.organization_id}
            onSaved={loadFacility}
            triggerLabel="Add insurance"
          />
        </div>
      )}

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
        coverImageUrl={org?.cover_image_url ?? null}
        outOfNetworkOnly={
          !contractsLoadFailed &&
          isOutOfNetworkOnlyFacility(contracts, { selfPayOnly: facility.self_pay_only })
        }
      />

      {extraReps.length > 0 && (
        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-sm font-semibold">Additional BD contacts</h2>
          <p className="text-xs text-muted-foreground">
            Shown to signed-in referral partners. Internal notes are never displayed here.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {extraReps.map((rep) => (
              <div key={rep.id} className="rounded-lg border border-border/60 p-3">
                <BdContactLine
                  name={rep.full_name}
                  phone={rep.phone}
                  email={rep.email}
                  title={rep.title}
                />
                {rep.territory || rep.availability_status ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {[rep.territory, rep.availability_status].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
