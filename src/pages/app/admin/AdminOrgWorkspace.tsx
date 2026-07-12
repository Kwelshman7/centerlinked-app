import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  BadgeCheck,
  ExternalLink,
  Lock,
  MapPin,
  Trash2,
  LayoutDashboard,
  Link2,
  Palette,
} from "lucide-react";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { AddFacilityDialog } from "@/components/app/facility/AddFacilityDialog";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { OrgSharedLinksPanel } from "@/components/app/OrgSharedLinksPanel";
import { AdminOrgBrandingForm } from "@/components/app/admin/AdminOrgBrandingForm";
import { EditOrganizationDialog, type OrgEditable } from "@/components/app/admin/EditOrganizationDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TABS = ["dashboard", "links", "branding", "facilities"] as const;
type TabId = (typeof TABS)[number];

interface OrgHeader extends OrgEditable {
  slug: string | null;
}

interface FacilityRow {
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
  capacity: number | null;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations: string[] | null;
  image_urls: string[];
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  verification_status: "pending" | "approved" | "rejected";
}

interface ContractRow {
  id: string;
  facility_id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

export default function AdminOrgWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgHeader | null>(null);
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  const tab = useMemo(() => {
    const t = searchParams.get("tab");
    return TABS.includes(t as TabId) ? (t as TabId) : "dashboard";
  }, [searchParams]);

  const setTab = (next: TabId) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next === "dashboard") p.delete("tab");
      else p.set("tab", next);
      return p;
    });
  };

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!id) return;
    const quiet = opts?.quiet === true;
    if (!quiet) setLoading(true);
    const [{ data: o }, { data: f }] = await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id,name,slug,logo_url,hq_city,hq_state,email_domain,website,description,verified,phone,bd_contact_name,bd_contact_phone,bd_contact_email",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("facilities").select("*").eq("organization_id", id).order("name"),
    ]);
    setOrg((o as OrgHeader) ?? null);
    const facs = (f as FacilityRow[]) ?? [];
    setFacilities(facs);
    if (facs.length > 0) {
      const { data: c } = await supabase
        .from("insurance_contracts")
        .select("id,facility_id,payer_id,payer_name,in_network")
        .in(
          "facility_id",
          facs.map((x) => x.id),
        );
      setContracts((c as ContractRow[]) ?? []);
    } else {
      setContracts([]);
    }
    if (!quiet) setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (id) sessionStorage.setItem("cl_managed_org_id", id);
  }, [id]);

  const refreshQuiet = useCallback(() => {
    void load({ quiet: true });
  }, [load]);

  const deleteFacility = async (fid: string, name: string) => {
    const { error } = await supabase.from("facilities").delete().eq("id", fid);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted ${name}`);
    void load({ quiet: true });
  };

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isSuperAdmin) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2">Super admin access only.</p>
      </Card>
    );
  }
  if (loading || !org) return <div className="p-8 text-center text-muted-foreground">Loading organization…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        to="/app/admin/organizations"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3 w-3" /> All organizations
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-20 h-20 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">{org.name}</h1>
              {org.verified && (
                <Badge variant="secondary">
                  <BadgeCheck className="h-3.5 w-3.5 text-success" /> Verified
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">Super-admin workspace</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              {(org.hq_city || org.hq_state) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {[org.hq_city, org.hq_state].filter(Boolean).join(", ")}
                </span>
              )}
              {org.email_domain && <span>· {org.email_domain}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <EditOrganizationDialog org={org} onSaved={load} triggerLabel="Edit profile" />
            {org.slug && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/o/${org.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" /> Public page
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5">
            <Link2 className="h-4 w-4" /> Shared links
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="facilities" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Facilities ({facilities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <OrgDashboard
            organizationId={org.id}
            adminMode
            welcomeName={org.name}
            onFacilitiesChanged={refreshQuiet}
          />
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <OrgSharedLinksPanel organizationId={org.id} orgName={org.name} orgSlug={org.slug} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <AdminOrgBrandingForm organizationId={org.id} onSaved={load} />
        </TabsContent>

        <TabsContent value="facilities" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold">Facilities</h2>
            <AddFacilityDialog organizationId={org.id} onCreated={load} />
          </div>

          {facilities.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No facilities yet</p>
              <div className="mt-4 inline-flex">
                <AddFacilityDialog organizationId={org.id} onCreated={load} />
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {facilities.map((f) => {
                const fContracts = contracts.filter((c) => c.facility_id === f.id);
                return (
                  <Card key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                      {f.image_urls?.[0] ? (
                        <img src={f.image_urls[0]} alt={f.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{f.name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {f.verification_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[f.city, f.state].filter(Boolean).join(", ") || "No location"} · {fContracts.length} contracts
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/facilities/${f.id}`}>
                          <ExternalLink className="h-4 w-4" /> Open
                        </Link>
                      </Button>
                      <EditFacilityDialog
                        facility={{ ...f, accreditations: f.accreditations ?? [] }}
                        contracts={fContracts.map((c) => ({
                          id: c.id,
                          payer_id: c.payer_id,
                          payer_name: c.payer_name,
                          in_network: c.in_network,
                        }))}
                        onSaved={load}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this facility?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes {f.name} and its insurance contracts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFacility(f.id, f.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete facility
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
