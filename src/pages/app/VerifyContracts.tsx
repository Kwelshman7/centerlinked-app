import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VerificationBadge } from "@/components/app/search/VerificationBadge";
import { stampVerified, verificationState } from "@/lib/verification";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";


interface Facility {
  id: string;
  name: string;
  organization_id: string;
  city: string | null;
  state: string | null;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
}

interface Contract {
  id: string;
  payer_name: string;
  payer_id: string | null;
  in_network: boolean;
}

export default function VerifyContracts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isSuperAdmin } = useAuth();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState<null | "confirm" | "update">(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: f } = await supabase
        .from("facilities")
        .select("id,name,organization_id,city,state,contracts_verified_at,verification_frozen")
        .eq("id", id)
        .maybeSingle();
      setFacility(f as Facility | null);
      const { data: c } = await supabase
        .from("insurance_contracts")
        .select("id,payer_name,payer_id,in_network")
        .eq("facility_id", id)
        .eq("in_network", true)
        .order("payer_name");
      setContracts((c as Contract[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  const canEdit =
    !!facility && (isSuperAdmin || profile?.organization_id === facility.organization_id);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!facility) return <div className="py-20 text-center text-muted-foreground">Facility not found.</div>;
  if (!canEdit) return <div className="py-20 text-center text-muted-foreground">You don't have access to verify this facility.</div>;

  const state = verificationState(facility.contracts_verified_at, facility.verification_frozen);

  const logVerification = async (action: "confirmed_no_changes" | "updated_contracts") => {
    if (!user) return;
    await supabase.from("contract_verifications").insert({
      facility_id: facility.id,
      user_id: user.id,
      action,
      notes: notes.trim() || null,
    });
  };

  const confirmNoChanges = async () => {
    if (!user) return;
    setSaving("confirm");
    const { error } = await stampVerified(facility.id, user.id);
    if (error) { toast.error(error.message); setSaving(null); return; }
    await logVerification("confirmed_no_changes");
    toast.success("Contracts confirmed accurate");
    navigate(`/app/facilities/${facility.id}`);
  };

  const removeContract = async (cid: string) => {
    const { error } = await supabase.from("insurance_contracts").delete().eq("id", cid);
    if (error) { toast.error(error.message); return; }
    setContracts((cs) => cs.filter((c) => c.id !== cid));
  };

  const addContract = async (payer: { id: string | null; name: string }) => {
    if (contracts.some((c) => c.payer_name.toLowerCase() === payer.name.toLowerCase())) {
      toast.info("Already on the list");
      return;
    }
    const { data, error } = await supabase
      .from("insurance_contracts")
      .insert({
        facility_id: facility.id,
        payer_id: payer.id,
        payer_name: payer.name,
        in_network: true,
      })
      .select("id,payer_name,payer_id,in_network")
      .single();
    if (error) { toast.error(error.message); return; }
    setContracts((cs) => [...cs, data as Contract].sort((a, b) => a.payer_name.localeCompare(b.payer_name)));
  };

  const saveEdits = async () => {
    if (!user) return;
    setSaving("update");
    const { error } = await stampVerified(facility.id, user.id);
    if (error) { toast.error(error.message); setSaving(null); return; }
    await logVerification("updated_contracts");
    toast.success("Contracts updated and verified");
    navigate(`/app/facilities/${facility.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <Link to={`/app/facilities/${facility.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to facility
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-bold">Verify contracts</h1>
          <VerificationBadge verifiedAt={facility.contracts_verified_at} frozen={facility.verification_frozen} size="md" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {facility.name}{facility.city || facility.state ? ` · ${[facility.city, facility.state].filter(Boolean).join(", ")}` : ""}
        </p>
        {state.daysAgo !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            Last verified {state.daysAgo === 0 ? "today" : `${state.daysAgo} day${state.daysAgo === 1 ? "" : "s"} ago`}.
          </p>
        )}
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">In-network insurance</h2>
            <Badge variant="secondary" className="text-[10px]">{contracts.length}</Badge>
          </div>
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit list
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Done editing</Button>
          )}
        </div>

        {contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No in-network contracts on file yet. Add some below.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {contracts.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">
                {c.payer_name}
                {editing && (
                  <button
                    onClick={() => removeContract(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${c.payer_name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {editing && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add an insurance company
            </p>
            <PayerCombobox
              payerId={null}
              payerName=""
              onSelect={(p) => addContract({ id: p.id, name: p.name })}
              approvedOnly
              keepOpenOnSelect
              placeholder="Search insurance to add…"
            />
          </div>
        )}
      </Card>



      <Card className="p-5 space-y-3">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          rows={3}
          placeholder="Anything an admin should know about this verification…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          onClick={confirmNoChanges}
          disabled={saving !== null}
          className="h-12"
        >
          {saving === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          All contracts are accurate
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={saveEdits}
          disabled={saving !== null || !editing}
          className="h-12"
        >
          {saving === "update" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          Save edits & verify
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Verifying resets the 30-day freshness clock and keeps your facility visible in search.
      </p>
    </div>
  );
}
