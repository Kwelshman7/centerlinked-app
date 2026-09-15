import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { loadApprovedPayers } from "@/lib/load-approved-payers";
import { searchWorkHrefFromFilters } from "@/lib/search-session";
import type { PayerMatchInput } from "@/lib/match-payer";

export default function Insurance() {
  const navigate = useNavigate();
  const [payers, setPayers] = useState<PayerMatchInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadApprovedPayers();
        if (!cancelled) setPayers(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load insurance.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = payers ?? [];
    if (!needle) return rows;
    return rows.filter((payer) => {
      if (payer.name.toLowerCase().includes(needle)) return true;
      return (payer.aliases ?? []).some((alias) => alias.toLowerCase().includes(needle));
    });
  }, [payers, q]);

  const openSearch = (payer: PayerMatchInput) => {
    navigate(
      searchWorkHrefFromFilters({
        payerId: payer.id,
        payerName: payer.name,
        planType: "",
        state: "",
        city: "",
        zip: "",
        specialty: "",
        accreditation: "",
        loc: "",
      }),
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Insurance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Browse approved payers, then search in-network facilities. This is not the admin payer database.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search payers..."
          className="h-10 pl-9"
        />
      </div>

      {error ? <Card className="p-4 text-sm text-destructive">{error}</Card> : null}

      {payers === null && !error ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((payer) => (
            <button
              key={payer.id}
              type="button"
              onClick={() => openSearch(payer)}
              className="rounded-xl border border-border/60 bg-card p-4 text-left hover:border-primary/40 hover:bg-accent/40 transition-colors"
            >
              <p className="font-medium">{payer.name}</p>
              {payer.aliases?.length ? (
                <p className="mt-1 text-xs text-muted-foreground truncate">{payer.aliases.slice(0, 3).join(", ")}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Search in-network facilities</p>
              )}
            </button>
          ))}
          {filtered.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No approved payers match that search.
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
