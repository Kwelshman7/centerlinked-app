import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Building2, Shield, Snowflake, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { VerificationBadge, verificationState } from "@/components/app/search/VerificationBadge";

import { PreferredProviderManager } from "@/components/app/admin/PreferredProviderManager";

interface PendingFacility {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  image_urls: string[];
  organization_id: string;
}

interface PendingPayer {
  id: string;
  name: string;
  category: string;
  created_by: string | null;
  created_at: string;
}

interface FreshnessRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  organization_id: string;
  organization_name?: string;
}

export default function Verifications() {
  const { isSuperAdmin, user, loading } = useAuth();
  const [facilities, setFacilities] = useState<PendingFacility[]>([]);
  const [orgs, setOrgs] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pendingPayers, setPendingPayers] = useState<PendingPayer[]>([]);
  const [freshness, setFreshness] = useState<FreshnessRow[]>([]);
  const [freezing, setFreezing] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("facilities")
      .select("id,name,city,state,description,image_urls,organization_id")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });
    const list = (data as PendingFacility[]) ?? [];
    setFacilities(list);
    if (list.length) {
      const { data: o } = await supabase.from("organizations").select("id,name").in("id", list.map((x) => x.organization_id));
      const map: Record<string, string> = {};
      (o ?? []).forEach((row) => { map[(row as { id: string; name: string }).id] = (row as { id: string; name: string }).name; });
      setOrgs(map);
    }
  };

  const loadPayers = async () => {
    const { data } = await supabase
      .from("payers")
      .select("id,name,category,created_by,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingPayers((data as PendingPayer[]) ?? []);
  };

  const loadFreshness = async () => {
    const { data } = await supabase
      .from("facilities")
      .select("id,name,city,state,contracts_verified_at,verification_frozen,organization_id,organizations(name)")
      .eq("verification_status", "approved")
      .order("contracts_verified_at", { ascending: true, nullsFirst: true });
    const rows: FreshnessRow[] = ((data as Array<FreshnessRow & { organizations: { name: string } | null }>) ?? []).map((r) => ({
      ...r,
      organization_name: r.organizations?.name,
    }));
    setFreshness(rows);
  };

  useEffect(() => {
    if (isSuperAdmin) {
      load();
      loadPayers();
      loadFreshness();
    }
  }, [isSuperAdmin]);

  const runFreezeCheck = async () => {
    setFreezing(true);
    const { data, error } = await supabase.functions.invoke("freeze-stale-contracts");
    setFreezing(false);
    if (error) { toast.error(error.message); return; }
    const n = (data as { frozen?: number })?.frozen ?? 0;
    toast.success(n === 0 ? "No facilities needed freezing" : `Froze ${n} stale ${n === 1 ? "facility" : "facilities"}`);
    loadFreshness();
  };

  const approvePayer = async (id: string) => {
    const { error } = await supabase
      .from("payers")
      .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payer approved — now live in dropdown");
    loadPayers();
  };

  const rejectPayer = async (id: string) => {
    const { error } = await supabase.from("payers").update({ status: "rejected" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payer rejected");
    loadPayers();
  };

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const approve = async (id: string) => {
    const { error } = await supabase.from("facilities").update({
      verification_status: "approved",
      verified_at: new Date().toISOString(),
      verified_by: user?.id,
      rejection_reason: null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Approved");
    load();
  };

  const reject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) { toast.error("Provide a rejection reason"); return; }
    const { error } = await supabase.from("facilities").update({
      verification_status: "rejected",
      rejection_reason: reason,
      verified_by: user?.id,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected");
    load();
  };

  const counts = freshness.reduce(
    (acc, r) => {
      const tier = verificationState(r.contracts_verified_at, r.verification_frozen).tier;
      if (tier === "frozen") acc.frozen++;
      else if (tier === "fresh" || tier === "recent") acc.fresh++;
      else acc.stale++;
      return acc;
    },
    { fresh: 0, stale: 0, frozen: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Verifications</h1>
        <p className="text-sm text-muted-foreground">Review pending facilities, payer suggestions, and contract freshness.</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="freshness">Contract freshness</TabsTrigger>
          
          <TabsTrigger value="preferred">Preferred providers</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-4">
          {/* Pending payer suggestions */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-lg font-bold">Insurance payer suggestions</h2>
              {pendingPayers.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {pendingPayers.length} pending
                </span>
              )}
            </div>
            {pendingPayers.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No payer suggestions waiting.</Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {pendingPayers.map((p) => (
                  <Card key={p.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Suggested {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => approvePayer(p.id)}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectPayer(p.id)}><XCircle className="h-4 w-4" /> Reject</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {facilities.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">All caught up — no pending facilities.</Card>
          ) : (
            <div className="space-y-4">
              {facilities.map((f) => (
                <Card key={f.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[200px_1fr] gap-4">
                    <div className="bg-muted aspect-video md:aspect-auto md:h-full">
                      {f.image_urls?.[0] ? <img src={f.image_urls[0]} alt={f.name} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full grid place-items-center text-muted-foreground"><Building2 className="h-10 w-10" /></div>
                      )}
                    </div>
                    <div className="p-4 md:p-5 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{orgs[f.organization_id] || "Organization"}</p>
                        <h3 className="font-heading text-lg font-bold">{f.name}</h3>
                        <p className="text-xs text-muted-foreground">{[f.city, f.state].filter(Boolean).join(", ")}</p>
                      </div>
                      {f.description && <p className="text-sm text-foreground line-clamp-3">{f.description}</p>}
                      <Textarea placeholder="Rejection reason (required to reject)" rows={2}
                        value={reasons[f.id] || ""} onChange={(e) => setReasons((p) => ({ ...p, [f.id]: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(f.id)}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => reject(f.id)}><XCircle className="h-4 w-4" /> Reject</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="freshness" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Fresh</p>
              <p className="text-2xl font-bold text-success">{counts.fresh}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Needs confirmation</p>
              <p className="text-2xl font-bold text-amber-600">{counts.stale}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Frozen</p>
              <p className="text-2xl font-bold text-destructive">{counts.frozen}</p>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={runFreezeCheck} disabled={freezing}>
              {freezing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Snowflake className="h-4 w-4" />}
              Run freeze check now
            </Button>
          </div>

          <Card className="divide-y">
            {freshness.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No approved facilities yet.</div>
            ) : freshness.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.organization_name || "—"} · {[r.city, r.state].filter(Boolean).join(", ") || "Location TBD"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VerificationBadge verifiedAt={r.contracts_verified_at} frozen={r.verification_frozen} />
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/facilities/${r.id}/verify`}>
                      <RefreshCw className="h-3.5 w-3.5" /> Verify
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>


        <TabsContent value="preferred" className="mt-4">
          <PreferredProviderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
