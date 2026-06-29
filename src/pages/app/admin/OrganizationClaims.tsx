import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Check, X, Mail, Phone, FileText, ExternalLink, Building2 } from "lucide-react";

interface Claim {
  id: string;
  organization_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  claimant_role: string | null;
  notes: string | null;
  proof_url: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  organizations: { name: string; slug: string | null } | null;
}

export default function OrganizationClaims() {
  const { isSuperAdmin, loading: authLoading, user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organization_claims")
      .select("*, organizations(name, slug)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setClaims((data as unknown as Claim[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin]);

  const openProof = async (claim: Claim) => {
    if (!claim.proof_url) return;
    if (proofUrls[claim.id]) {
      window.open(proofUrls[claim.id], "_blank");
      return;
    }
    const { data, error } = await supabase.storage
      .from("claim-proofs")
      .createSignedUrl(claim.proof_url, 60 * 10);
    if (error || !data?.signedUrl) { toast.error("Could not load proof file"); return; }
    setProofUrls((p) => ({ ...p, [claim.id]: data.signedUrl }));
    window.open(data.signedUrl, "_blank");
  };

  const setStatus = async (id: string, status: "approved" | "denied") => {
    const { error } = await supabase
      .from("organization_claims")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Claim ${status}`);
    load();
  };

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Organization claims</h1>
        <p className="text-sm text-muted-foreground">Review users requesting to claim an organization profile.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        claims.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No claims yet.</Card>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => (
              <Card key={c.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{c.organizations?.name ?? "Unknown org"}</h3>
                      <Badge variant={c.status === "pending" ? "secondary" : c.status === "approved" ? "default" : "destructive"}>
                        {c.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {c.status}
                      </Badge>
                      {c.organizations?.slug && (
                        <a href={`/o/${c.organizations.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                          View page <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm mt-2">
                      <strong>{c.claimant_name}</strong>
                      {c.claimant_role && <span className="text-muted-foreground"> · {c.claimant_role}</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                      <a href={`mailto:${c.claimant_email}`} className="text-primary inline-flex items-center gap-1 hover:underline">
                        <Mail className="h-3.5 w-3.5" /> {c.claimant_email}
                      </a>
                      {c.claimant_phone && (
                        <a href={`tel:${c.claimant_phone}`} className="text-primary inline-flex items-center gap-1 hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {c.claimant_phone}
                        </a>
                      )}
                    </div>
                    {c.notes && <p className="text-sm mt-2 p-3 bg-muted rounded-lg whitespace-pre-line">{c.notes}</p>}
                    {c.proof_url && (
                      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => openProof(c)}>
                        <FileText className="h-4 w-4" /> View proof of ownership
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "denied")}>
                        <X className="h-4 w-4" /> Deny
                      </Button>
                      <Button size="sm" onClick={() => setStatus(c.id, "approved")}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      <p className="text-xs text-muted-foreground">
        Approving a claim does not yet auto-link the user. After approving, manually invite them as a facility admin from the organization's Members page.
      </p>
    </div>
  );
}
