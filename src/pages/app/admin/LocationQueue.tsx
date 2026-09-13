import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import {
  groupDuplicateNames,
  groupDuplicateStreets,
  knownDistinctLabel,
  locationGaps,
  type LocationGap,
} from "@/lib/location-quality";
import { recordVerificationEvent } from "@/lib/record-verification-event";

type Filter = LocationGap | "incomplete" | "duplicates";

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
  organization_id: string;
  org_name: string;
}

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "incomplete", label: "Any missing field" },
  { value: "street", label: "Missing street" },
  { value: "zip", label: "Missing or invalid ZIP" },
  { value: "city", label: "Missing city" },
  { value: "phone", label: "Missing phone" },
  { value: "website", label: "Missing website" },
  { value: "gallery", label: "Missing photos" },
  { value: "duplicates", label: "Possible duplicates" },
];

export default function LocationQueue() {
  const { isSuperAdmin, user, loading } = useAuth();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const initialFilter = params.get("filter") === "duplicates" ? "duplicates" : "incomplete";
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState({
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select(
        "id,name,city,state,zip,address_line1,phone,website,image_urls,organization_id,organizations(name)",
      )
      .eq("verification_status", "approved")
      .order("name");
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(
      ((data as Array<Row & { organizations: { name: string } | null }>) ?? []).map((row) => ({
        ...row,
        org_name: row.organizations?.name ?? "Unknown organization",
      })),
    );
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const nameDupes = useMemo(() => groupDuplicateNames(rows ?? []), [rows]);
  const streetDupes = useMemo(() => groupDuplicateStreets(rows ?? []), [rows]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((row) => {
      const gaps = locationGaps(row);
      if (filter === "incomplete" && gaps.length === 0) return false;
      if (filter !== "incomplete" && filter !== "duplicates" && !gaps.includes(filter)) return false;
      if (filter === "duplicates") {
        const inName = nameDupes.some((group) => group.some((item) => item.id === row.id));
        const inStreet = streetDupes.some((group) => group.some((item) => item.id === row.id));
        if (!inName && !inStreet) return false;
      }
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [row.name, row.org_name, row.city, row.state, row.address_line1]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, filter, search, nameDupes, streetDupes]);

  const incomplete = rows?.filter((row) => locationGaps(row).length > 0).length ?? 0;

  const openEdit = (row: Row) => {
    setEditing(row);
    setDraft({
      address_line1: row.address_line1 ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      zip: row.zip ?? "",
      phone: row.phone ?? "",
      website: row.website ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase
      .from("facilities")
      .update({
        address_line1: draft.address_line1.trim() || null,
        city: draft.city.trim() || null,
        state: draft.state.trim() || null,
        zip: draft.zip.trim() || null,
        phone: draft.phone.trim() || null,
        website: draft.website.trim() || null,
      })
      .eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await recordVerificationEvent({
      facilityId: editing.id,
      entityType: "location",
      action: "updated_location",
      actorId: user?.id,
      notes: "Location fields edited. Blank values left unknown.",
    });
    toast.success("Location fields updated. Empty values stay empty — nothing was invented.");
    setEditing(null);
    load();
  };

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MapPin className="h-6 w-6 text-primary" />
          Location completeness
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {incomplete} approved listings are missing street, city, ZIP, phone, website, or photos.
          Do not guess an address. Same-name programs in different states stay separate listings.
        </p>
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
        <Select value={filter} onValueChange={(v: Filter) => setFilter(v)}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filter === "duplicates" && (
        <div className="space-y-3">
          {[...nameDupes.map((group) => ({ kind: "name" as const, group })), ...streetDupes.map((group) => ({ kind: "street" as const, group }))].map(
            ({ kind, group }) => {
              const note =
                group.length === 2 ? knownDistinctLabel(group[0].id, group[1].id) : null;
              return (
                <Card key={`${kind}-${group.map((item) => item.id).join("-")}`} className="space-y-2 p-4">
                  <p className="text-sm font-semibold">
                    {kind === "name" ? "Same title" : "Same street"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {note ?? "Review before any merge. Listings keep their own IDs and slugs."}
                  </p>
                  <ul className="text-sm">
                    {group.map((item) => (
                      <li key={item.id}>
                        <Link to={`/app/facilities/${item.id}`} className="hover:text-primary">
                          {item.name}
                        </Link>
                        {" · "}
                        {[item.city, item.state].filter(Boolean).join(", ") || "No city"}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            },
          )}
        </div>
      )}

      <div className="space-y-2">
        {rows === null ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : filter === "duplicates" ? null : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No listings in this filter.</Card>
        ) : (
          filtered.map((row) => {
            const gaps = locationGaps(row);
            const place = [row.address_line1, row.city, row.state, row.zip].filter(Boolean).join(", ");
            return (
              <Card key={row.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="min-w-0">
                  <Link to={`/app/facilities/${row.id}`} className="font-semibold hover:text-primary">
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.org_name}
                    {place ? ` · ${place}` : " · No address on file"}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">Missing: {gaps.join(", ") || "none"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                  Edit location
                </Button>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit location</DialogTitle>
            <DialogDescription>
              Enter only values you have confirmed. Leave a field blank to keep it unknown.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {(
              [
                ["address_line1", "Street"],
                ["city", "City"],
                ["state", "State"],
                ["zip", "ZIP"],
                ["phone", "Phone"],
                ["website", "Website"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={draft[key]}
                  onChange={(e) => setDraft((current) => ({ ...current, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
