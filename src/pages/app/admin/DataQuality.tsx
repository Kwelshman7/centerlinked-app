import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Gauge } from "lucide-react";
import { toast } from "sonner";
import { completenessResult, COMPLETENESS_CHECKS, coverageShare } from "@/lib/data-quality";
import { groupDuplicateNames, groupDuplicateStreets } from "@/lib/location-quality";
import { VERIFICATION_DISCLAIMER } from "@/lib/verification-events";

interface Row {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  address_line1: string | null;
  phone: string | null;
  website: string | null;
  image_urls: string[] | null;
  self_pay_only: boolean | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  contract_count: number;
}

export default function DataQuality() {
  const { isSuperAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [searchDemand, setSearchDemand] = useState<number | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select(
        "id,name,city,state,zip,address_line1,phone,website,image_urls,self_pay_only,bd_contact_name,bd_contact_phone,bd_contact_email,insurance_contracts(id)",
      )
      .eq("verification_status", "approved");
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(
      ((data as Array<Row & { insurance_contracts: { id: string }[] | null }>) ?? []).map((row) => ({
        ...row,
        contract_count: row.insurance_contracts?.length ?? 0,
      })),
    );
    const demand = await supabase.from("search_events").select("id", { count: "exact", head: true });
    setSearchDemand(demand.error ? null : demand.count ?? 0);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    const scored = list.map((row) => completenessResult(row));
    const missingInsurance = list.filter((row) => completenessResult(row).missing.includes("insurance")).length;
    const missingBd = list.filter((row) => completenessResult(row).missing.includes("bd")).length;
    const missingLocation = list.filter((row) =>
      completenessResult(row).missing.some((key) => ["street", "city", "zip", "phone", "website", "gallery"].includes(key)),
    ).length;
    const avg =
      scored.length === 0
        ? 0
        : Math.round(scored.reduce((sum, item) => sum + item.percent, 0) / scored.length);
    const byState = new Map<string, number>();
    for (const row of list) {
      const state = (row.state ?? "").trim().toUpperCase() || "Unknown";
      byState.set(state, (byState.get(state) ?? 0) + 1);
    }
    const states = [...byState.entries()].sort((a, b) => b[1] - a[1]);
    const top3 = states.slice(0, 3);
    const top3Share = coverageShare(
      top3.reduce((sum, [, n]) => sum + n, 0),
      list.length,
    );
    return {
      total: list.length,
      avg,
      missingInsurance,
      missingBd,
      missingLocation,
      nameDupes: groupDuplicateNames(list).length,
      streetDupes: groupDuplicateStreets(list).length,
      states,
      top3,
      top3Share,
    };
  }, [rows]);

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Gauge className="h-6 w-6 text-primary" />
          Data quality
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completeness is {COMPLETENESS_CHECKS.length} equally weighted checks. Missing data stays
          unknown. {VERIFICATION_DISCLAIMER}
        </p>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Approved listings</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Average completeness</p>
              <p className="text-2xl font-semibold">{stats.avg}%</p>
              <p className="text-[11px] text-muted-foreground">Passed checks / {COMPLETENESS_CHECKS.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">States represented</p>
              <p className="text-2xl font-semibold">{stats.states.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Search demand</p>
              <p className="text-2xl font-semibold">
                {searchDemand === null ? "Unavailable" : searchDemand}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {searchDemand === null
                  ? "Search-event tracking is not readable yet."
                  : searchDemand === 0
                    ? "No recorded searches yet — historical demand was not backfilled."
                    : "Recorded searches going forward. Not invented demand."}
              </p>
            </Card>
          </div>

          <Card className="space-y-3 p-4">
            <h2 className="font-heading text-sm font-semibold">Open a queue</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/app/admin/insurance-queue">{stats.missingInsurance} missing insurance</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/admin/bd-queue">{stats.missingBd} missing BD contacts</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/admin/location-queue">{stats.missingLocation} location gaps</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/admin/location-queue?filter=duplicates">
                  {stats.nameDupes + stats.streetDupes} possible duplicate groups
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/admin/audit">Verification audit</Link>
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-heading text-sm font-semibold">Checks (each is 1 point)</h2>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {COMPLETENESS_CHECKS.map((check) => (
                <li key={check.key}>• {check.label}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-heading text-sm font-semibold">Network coverage</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} approved listings across {stats.states.length} states. The three largest
              states are {stats.top3Share}% of the directory. This is listing supply, not referral
              demand.
            </p>
            <ul className="text-sm">
              {stats.states.slice(0, 12).map(([state, count]) => (
                <li key={state}>
                  {state}: {count} ({coverageShare(count, stats.total)}%)
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
