import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tags } from "lucide-react";

type Domain = "accreditation" | "payer";
type ActionFilter = "review" | "mapped" | "parent_set" | "all";

interface LogRow {
  id: string;
  domain: Domain;
  action: string;
  source_label: string;
  target_slug: string | null;
  target_name: string | null;
  facility_id: string | null;
  notes: string | null;
  created_at: string;
}

export default function NormalizationQueue() {
  const { isSuperAdmin, loading } = useAuth();
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | "all">("accreditation");
  const [action, setAction] = useState<ActionFilter>("review");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: loadError } = await supabase
        .from("normalization_change_log")
        .select("id,domain,action,source_label,target_slug,target_name,facility_id,notes,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (cancelled) return;
      if (loadError) {
        setError(loadError.message);
        setRows([]);
        return;
      }
      setRows((data as LogRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((row) => {
      if (domain !== "all" && row.domain !== domain) return false;
      if (action !== "all" && row.action !== action) return false;
      return true;
    });
  }, [rows, domain, action]);

  const grouped = useMemo(() => {
    const map = new Map<string, { sample: LogRow; count: number }>();
    for (const row of filtered) {
      const key = `${row.domain}:${row.action}:${row.source_label}:${row.target_slug ?? ""}`;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { sample: row, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filtered]);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const reviewCount = rows?.filter((row) => row.action === "review").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Tags className="h-6 w-6 text-primary" />
            Canonical names
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alias review for insurance and accreditations. Original imported text was not overwritten.
            Anthem stays Anthem — it is not merged into Blue Cross Blue Shield.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/admin/insurance">Insurance DB</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/insurance-queue">Insurance queue</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 text-sm">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p>
            <span className="font-medium">{reviewCount}</span> labels need a human decision.
            Mapped rows are display aliases only.
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={domain}
          onChange={(e) => setDomain(e.target.value as Domain | "all")}
        >
          <option value="accreditation">Accreditations</option>
          <option value="payer">Insurance labels</option>
          <option value="all">All domains</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={action}
          onChange={(e) => setAction(e.target.value as ActionFilter)}
        >
          <option value="review">Needs review</option>
          <option value="mapped">Mapped</option>
          <option value="parent_set">Payer parents</option>
          <option value="all">All actions</option>
        </select>
      </div>

      <div className="space-y-2">
        {grouped.map(({ sample, count }) => (
          <Card key={sample.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{sample.source_label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sample.target_name
                    ? `Canonical: ${sample.target_name}`
                    : sample.notes || "Left unchanged"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{sample.action}</Badge>
                <span className="text-xs text-muted-foreground">{count} record{count === 1 ? "" : "s"}</span>
              </div>
            </div>
          </Card>
        ))}
        {rows && grouped.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing in this filter.</p>
        )}
      </div>
    </div>
  );
}
