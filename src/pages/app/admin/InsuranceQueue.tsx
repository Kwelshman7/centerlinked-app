import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ShieldPlus, Link2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { InsuranceMatchBadge } from "@/components/app/search/InsuranceMatchBadge";
import {
  CONTRACT_STATUSES,
  VERIFICATION_METHODS,
  insuranceMatchFromContract,
  isNonCanonicalInsuranceLabel,
  type ContractStatus,
  type VerificationMethod,
} from "@/lib/insurance-contract-status";
import {
  bulkLinkCanonicalPayers,
  recordContractVerification,
  setFacilitySelfPayOnly,
  upsertAdminInsuranceContract,
} from "@/lib/admin-insurance";
import type { PayerMatchInput } from "@/lib/match-payer";

type QueueFilter = "missing" | "unlinked" | "non_payer" | "pending" | "self_pay" | "all";

interface QueueContract {
  id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
  contract_status: string;
  verified_at: string | null;
  verification_method: string | null;
  original_imported_value: string | null;
  internal_notes: string | null;
  notes: string | null;
}

interface QueueFacility {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  organization_id: string;
  org_name: string;
  self_pay_only: boolean;
  contracts: QueueContract[];
}

const emptyDraft = (facilityId: string) => ({
  facilityId,
  payerId: null as string | null,
  payerName: "",
  contractStatus: "pending_verification" as ContractStatus,
  verificationMethod: "" as VerificationMethod | "",
  publicNotes: "",
  internalNotes: "",
});

export default function InsuranceQueue() {
  const { isSuperAdmin, user, loading } = useAuth();
  const [rows, setRows] = useState<QueueFacility[] | null>(null);
  const [payers, setPayers] = useState<PayerMatchInput[]>([]);
  const [filter, setFilter] = useState<QueueFilter>("missing");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof emptyDraft> | null>(null);
  const [review, setReview] = useState<{ payerName: string; reason: string }[] | null>(null);

  const load = async () => {
    const [facRes, payerRes] = await Promise.all([
      supabase
        .from("facilities")
        .select(
          "id,name,city,state,organization_id,self_pay_only,organizations(name),insurance_contracts(id,payer_id,payer_name,in_network,contract_status,verified_at,verification_method,original_imported_value,internal_notes,notes)",
        )
        .eq("verification_status", "approved")
        .order("name"),
      supabase.from("payers").select("id,name,aliases").eq("status", "approved").eq("active", true),
    ]);
    if (facRes.error) {
      toast.error(facRes.error.message);
      setRows([]);
      return;
    }
    setPayers((payerRes.data as PayerMatchInput[]) ?? []);
    const list: QueueFacility[] = ((facRes.data as Array<{
      id: string;
      name: string;
      city: string | null;
      state: string | null;
      organization_id: string;
      self_pay_only: boolean | null;
      organizations: { name: string } | null;
      insurance_contracts: QueueContract[] | null;
    }>) ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      state: row.state,
      organization_id: row.organization_id,
      org_name: row.organizations?.name ?? "Unknown organization",
      self_pay_only: !!row.self_pay_only,
      contracts: row.insurance_contracts ?? [],
    }));
    setRows(list);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const unlinked = row.contracts.filter((c) => !c.payer_id);
      const nonPayer = row.contracts.filter((c) => isNonCanonicalInsuranceLabel(c.payer_name));
      const pending = row.contracts.filter((c) => c.contract_status === "pending_verification");
      if (filter === "missing" && (row.contracts.length > 0 || row.self_pay_only)) return false;
      if (filter === "unlinked" && unlinked.length === 0) return false;
      if (filter === "non_payer" && nonPayer.length === 0) return false;
      if (filter === "pending" && pending.length === 0) return false;
      if (filter === "self_pay" && !row.self_pay_only) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.org_name.toLowerCase().includes(q) ||
        (row.city ?? "").toLowerCase().includes(q) ||
        (row.state ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => {
    if (!rows) return { missing: 0, unlinked: 0, non_payer: 0, pending: 0, self_pay: 0, all: 0 };
    return {
      missing: rows.filter((r) => r.contracts.length === 0 && !r.self_pay_only).length,
      unlinked: rows.filter((r) => r.contracts.some((c) => !c.payer_id)).length,
      non_payer: rows.filter((r) => r.contracts.some((c) => isNonCanonicalInsuranceLabel(c.payer_name))).length,
      pending: rows.filter((r) => r.contracts.some((c) => c.contract_status === "pending_verification")).length,
      self_pay: rows.filter((r) => r.self_pay_only).length,
      all: rows.length,
    };
  }, [rows]);

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const saveDraft = async () => {
    if (!draft || !user) return;
    setBusy(true);
    const result = await upsertAdminInsuranceContract({
      facilityId: draft.facilityId,
      payerId: draft.payerId,
      payerName: draft.payerName,
      contractStatus: draft.contractStatus,
      verificationMethod: draft.verificationMethod || null,
      verifiedAt:
        draft.contractStatus === "active" && draft.verificationMethod
          ? new Date().toISOString()
          : null,
      verifiedBy: draft.contractStatus === "active" && draft.verificationMethod ? user.id : null,
      publicNotes: draft.publicNotes,
      internalNotes: draft.internalNotes,
      originalImportedValue: draft.payerName,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Contract saved");
    setDraft(null);
    load();
  };

  const markSelfPay = async (facilityId: string, next: boolean) => {
    setBusy(true);
    const result = await setFacilitySelfPayOnly(facilityId, next, user?.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(next ? "Marked self-pay only" : "Cleared self-pay only");
    load();
  };

  const verifyContract = async (facilityId: string, contractId: string) => {
    if (!user) return;
    setBusy(true);
    const result = await recordContractVerification({
      contractId,
      facilityId,
      userId: user.id,
      method: "bd_confirmation",
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Verification recorded");
    load();
  };

  const bulkLink = async () => {
    if (!rows) return;
    const unlinked = rows.flatMap((r) => r.contracts.filter((c) => !c.payer_id));
    if (unlinked.length === 0) {
      toast.info("No unlinked contracts");
      return;
    }
    setBusy(true);
    const result = await bulkLinkCanonicalPayers(unlinked, payers);
    setBusy(false);
    if ("ok" in result && result.ok === false) {
      toast.error(result.error);
      return;
    }
    if (!("linked" in result)) return;
    toast.success(`Linked ${result.linked} carrier${result.linked === 1 ? "" : "s"}`);
    setReview(result.review);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance completeness</h1>
          <p className="text-sm text-muted-foreground">
            {counts.missing} approved listings have no structured insurance contracts. Missing data
            stays unknown — it is not treated as out of network.
          </p>
        </div>
        <Button onClick={bulkLink} disabled={busy} variant="outline" className="w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Bulk-link exact payer names
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search facility, org, or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v: QueueFilter) => setFilter(v)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="missing">Missing insurance ({counts.missing})</SelectItem>
            <SelectItem value="unlinked">Unlinked carriers ({counts.unlinked})</SelectItem>
            <SelectItem value="non_payer">Non-payer labels ({counts.non_payer})</SelectItem>
            <SelectItem value="pending">Pending verification ({counts.pending})</SelectItem>
            <SelectItem value="self_pay">Self-pay only ({counts.self_pay})</SelectItem>
            <SelectItem value="all">All approved ({counts.all})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {review && review.length > 0 && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-medium">{review.length} labels need manual review</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {review.map((item) => (
              <li key={`${item.payerName}-${item.reason}`}>
                {item.payerName} — {item.reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-2">
        {rows === null ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading queue…
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No listings match this filter.
          </Card>
        ) : (
          filtered.map((row) => {
            const place = [row.city, row.state].filter(Boolean).join(", ");
            return (
              <Card key={row.id} className="space-y-3 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/app/facilities/${row.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.org_name}
                      {place ? ` · ${place}` : ""}
                      {row.contracts.length === 0
                        ? " · No structured contracts"
                        : ` · ${row.contracts.length} contract${row.contracts.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setDraft(emptyDraft(row.id))}
                    >
                      <ShieldPlus className="h-4 w-4" /> Add contract
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => markSelfPay(row.id, !row.self_pay_only)}
                    >
                      <Wallet className="h-4 w-4" />
                      {row.self_pay_only ? "Clear self-pay" : "Self-pay only"}
                    </Button>
                  </div>
                </div>

                {row.self_pay_only && <InsuranceMatchBadge status="self_pay" />}

                {row.contracts.length > 0 && (
                  <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                    {row.contracts.map((contract) => {
                      const match = insuranceMatchFromContract(contract);
                      return (
                        <li
                          key={contract.id}
                          className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium">{contract.payer_name}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <InsuranceMatchBadge status={match.status} />
                              {!contract.payer_id && (
                                <Badge variant="outline" className="text-[10px]">
                                  Unlinked
                                </Badge>
                              )}
                              {isNonCanonicalInsuranceLabel(contract.payer_name) && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Non-payer label
                                </Badge>
                              )}
                            </div>
                            {contract.original_imported_value &&
                            contract.original_imported_value !== contract.payer_name ? (
                              <p className="text-[11px] text-muted-foreground">
                                Imported as {contract.original_imported_value}
                              </p>
                            ) : null}
                            {contract.internal_notes ? (
                              <p className="text-[11px] text-muted-foreground">
                                Internal: {contract.internal_notes}
                              </p>
                            ) : null}
                          </div>
                          {match.status !== "verified" && contract.in_network && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => verifyContract(row.id, contract.id)}
                            >
                              Record verification
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add structured insurance contract</DialogTitle>
            <DialogDescription>
              Only add a carrier you have source data for. Leave unknown fields blank.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Carrier</Label>
                <PayerCombobox
                  payerId={draft.payerId}
                  payerName={draft.payerName}
                  onSelect={(payer) =>
                    setDraft((current) =>
                      current
                        ? { ...current, payerId: payer.id, payerName: payer.name }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contract status</Label>
                <Select
                  value={draft.contractStatus}
                  onValueChange={(v: ContractStatus) =>
                    setDraft((current) => (current ? { ...current, contractStatus: v } : current))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {draft.contractStatus === "active" && (
                <div className="space-y-1.5">
                  <Label>Verification method</Label>
                  <Select
                    value={draft.verificationMethod || "none"}
                    onValueChange={(v) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              verificationMethod: v === "none" ? "" : (v as VerificationMethod),
                            }
                          : current,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Required to mark verified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not verified yet</SelectItem>
                      {VERIFICATION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Public notes</Label>
                <Textarea
                  value={draft.publicNotes}
                  onChange={(e) =>
                    setDraft((current) =>
                      current ? { ...current, publicNotes: e.target.value } : current,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Internal notes</Label>
                <Textarea
                  value={draft.internalNotes}
                  onChange={(e) =>
                    setDraft((current) =>
                      current ? { ...current, internalNotes: e.target.value } : current,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={saveDraft} disabled={busy || !draft?.payerName.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
