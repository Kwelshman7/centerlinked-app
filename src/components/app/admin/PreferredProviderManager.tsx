import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Star, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  preferred_provider: boolean;
  preferred_until: string | null;
  organization_id: string;
  organization_name?: string;
}

export function PreferredProviderManager() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("facilities")
      .select("id,name,city,state,preferred_provider,preferred_until,organization_id,organizations(name)")
      .eq("verification_status", "approved")
      .order("preferred_provider", { ascending: false })
      .order("name", { ascending: true })
      .limit(500);
    const list: Row[] = ((data as Array<Row & { organizations: { name: string } | null }>) ?? []).map((r) => ({
      ...r,
      organization_name: r.organizations?.name,
    }));
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(term) ||
      (r.organization_name ?? "").toLowerCase().includes(term) ||
      (r.city ?? "").toLowerCase().includes(term) ||
      (r.state ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  const togglePreferred = async (r: Row, enabled: boolean) => {
    if (!user) return;
    setSaving(r.id);
    const { error } = await supabase
      .from("facilities")
      .update({ preferred_provider: enabled, preferred_until: enabled ? r.preferred_until : null })
      .eq("id", r.id);
    if (error) { setSaving(null); toast.error(error.message); return; }

    await supabase.from("preferred_provider_changes").insert({
      facility_id: r.id,
      enabled,
      expires_at: enabled ? r.preferred_until : null,
      set_by: user.id,
    });

    setSaving(null);
    toast.success(enabled ? "Marked as Preferred Provider" : "Removed from Preferred");
    load();
  };

  const setExpiry = async (r: Row, dateStr: string) => {
    if (!user) return;
    const iso = dateStr ? new Date(dateStr).toISOString() : null;
    const { error } = await supabase
      .from("facilities")
      .update({ preferred_until: iso })
      .eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("preferred_provider_changes").insert({
      facility_id: r.id,
      enabled: r.preferred_provider,
      expires_at: iso,
      set_by: user.id,
    });
    toast.success("Expiry updated");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search facility, org, city, state" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No facilities match.</Card>
      ) : (
        <Card className="divide-y">
          {filtered.map((r) => {
            const expiryInput = r.preferred_until ? new Date(r.preferred_until).toISOString().slice(0, 10) : "";
            return (
              <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium flex items-center gap-2 truncate">
                    {r.preferred_provider && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.organization_name || "—"} · {[r.city, r.state].filter(Boolean).join(", ") || "Location TBD"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.preferred_provider && (
                    <Input
                      type="date"
                      value={expiryInput}
                      onChange={(e) => setExpiry(r, e.target.value)}
                      className="h-9 w-[150px]"
                      aria-label="Preferred expiry date"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.preferred_provider}
                      onCheckedChange={(v) => togglePreferred(r, v)}
                      disabled={saving === r.id}
                    />
                    <span className="text-xs font-semibold w-20">
                      {r.preferred_provider ? "Preferred" : "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
