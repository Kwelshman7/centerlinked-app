import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";

// Canonical columns the importer understands. Extra columns are ignored.
// Any of the listed aliases (case-insensitive, punctuation-insensitive) will map.
const COLUMN_MAP: Record<string, string[]> = {
  name: ["name", "facility name", "facility", "facility_name"],
  tagline: ["tagline", "subtitle", "headline", "service type", "service_type"],
  address_line1: ["address", "address line 1", "address1", "street"],
  city: ["city"],
  state: ["state", "st"],
  zip: ["zip", "zipcode", "postal code", "postal"],
  phone: ["phone", "phone number", "main phone"],
  website: ["website", "url", "site", "logo"],
  description: ["description", "about", "summary", "notes", "population"],
  capacity: ["capacity", "beds", "bed count"],
  levels_of_care: ["levels of care", "loc", "level of care", "levels", "level_of_care"],
  highlights: ["highlights", "amenities", "features"],
  parent_company: ["parent company", "parent_company", "owner", "organization", "parent organization"],
  image_urls: ["image urls", "images", "photos", "image"],
  payers_in_network: [
    "in network payers",
    "payers in network",
    "in-network",
    "in network",
    "in network insurance",
    "insurance in network",
    "payers",
    "insurance networks",
    "insurance_networks",
  ],
  payers_out_of_network: [
    "out of network payers",
    "out-of-network",
    "out of network",
    "oon payers",
  ],
  bd_contact_name: ["bd rep", "bd contact", "bd contact name", "bd name"],
  bd_contact_phone: ["bd phone", "bd contact phone"],
  bd_contact_email: ["bd email", "bd contact email"],
};

// Expand abbreviated levels of care to canonical names
const LOC_ALIASES: Record<string, string> = {
  detox: "Detox",
  detoc: "Detox",
  "outpatient detox": "Detox",
  res: "Residential",
  residential: "Residential",
  "mh residential": "Mental Health Residential",
  "mental health residential": "Mental Health Residential",
  php: "PHP",
  iop: "IOP",
  "community iop": "IOP",
  "virtual iop": "IOP",
  "mh iop": "Mental Health PHP/IOP",
  "mh php": "Mental Health PHP/IOP",
  "mh php iop": "Mental Health PHP/IOP",
  "mental health php": "Mental Health PHP/IOP",
  "mental health iop": "Mental Health PHP/IOP",
  "mental health php iop": "Mental Health PHP/IOP",
  op: "Outpatient",
  outpatient: "Outpatient",
  sl: "Sober Living",
  "sober living": "Sober Living",
  mat: "MAT",
  mh: "Mental Health PHP/IOP",
  telehealth: "Telehealth",
  "virtual options": "Telehealth",
};

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Split list cells. Respects parentheses so "UHC (commercial, Medicaid)" stays one item.
const splitMulti = (v: string) => {
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of v) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ";" || ch === "|" || ch === "," || ch === "\n")) {
      const t = buf.trim().replace(/\.$/, "");
      if (t) out.push(t);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const t = buf.trim().replace(/\.$/, "");
  if (t) out.push(t);
  return out;
};

const expandLevels = (items: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const key = raw.toLowerCase().trim();
    const mapped = LOC_ALIASES[key] ?? raw.trim();
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
};

interface ParsedRow {
  raw: Record<string, string>;
  mapped: Record<string, any>;
  errors: string[];
}

function mapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const n = norm(h);
    for (const [canon, aliases] of Object.entries(COLUMN_MAP)) {
      if (aliases.some((a) => norm(a) === n)) {
        map[h] = canon;
        break;
      }
    }
  }
  return map;
}

function mapRow(raw: Record<string, string>, headerMap: Record<string, string>): ParsedRow {
  const mapped: Record<string, any> = {};
  // Track multi-source fields so several CSV columns can merge into one canonical field
  const descParts: string[] = [];
  const highlightParts: string[] = [];

  for (const [orig, canon] of Object.entries(headerMap)) {
    const v = (raw[orig] ?? "").toString().trim();
    if (!v) continue;
    if (canon === "levels_of_care") {
      mapped[canon] = expandLevels(splitMulti(v));
    } else if (["highlights", "image_urls", "payers_in_network", "payers_out_of_network"].includes(canon)) {
      const list = splitMulti(v);
      if (canon === "highlights") {
        for (const item of list) highlightParts.push(item);
      } else {
        mapped[canon] = list;
      }
    } else if (canon === "capacity") {
      const n = parseInt(v.replace(/[^\d]/g, ""), 10);
      if (!Number.isNaN(n)) mapped[canon] = n;
    } else if (canon === "description") {
      const label = norm(orig);
      if (label === "population") descParts.push(`Population: ${v}`);
      else descParts.push(v);
    } else {
      // First non-empty wins for single-value fields
      if (mapped[canon] == null) mapped[canon] = v;
    }
  }

  if (descParts.length) mapped.description = descParts.join("\n\n");
  if (highlightParts.length) mapped.highlights = Array.from(new Set(highlightParts));

  const errors: string[] = [];
  if (!mapped.name) errors.push("Missing facility name");
  return { raw, mapped, errors };
}

const TEMPLATE_HEADERS = [
  "Name",
  "Parent Company",
  "Tagline",
  "Address",
  "City",
  "State",
  "Zip",
  "Phone",
  "Website",
  "Description",
  "Capacity",
  "Levels of Care",
  "Highlights",
  "Image URLs",
  "In Network Payers",
  "Out of Network Payers",
  "BD Contact Name",
  "BD Contact Phone",
  "BD Contact Email",
];

const TEMPLATE_SAMPLE = [
  "Sunrise Malibu",
  "Sunrise Recovery Group",
  "Coastal residential care with private rooms",
  "123 Ocean Blvd",
  "Malibu",
  "CA",
  "90265",
  "(555) 123-4567",
  "https://sunriserecovery.com",
  "A 40-bed residential treatment facility specializing in dual diagnosis.",
  "40",
  "Detox; Residential; PHP",
  "Private rooms; Ocean view; Chef-prepared meals",
  "https://example.com/photo1.jpg; https://example.com/photo2.jpg",
  "Aetna; Cigna; Blue Cross Blue Shield",
  "United Healthcare",
  "",
  "",
  "",
];


export default function ImportFacilities() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<{ ok: number; failed: number } | null>(null);

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);
  const unmappedHeaders = useMemo(
    () => headers.filter((h) => !headerMap[h]),
    [headers, headerMap],
  );

  const downloadTemplate = () => {
    const csv = Papa.unparse({
      fields: TEMPLATE_HEADERS,
      data: [TEMPLATE_SAMPLE],
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "centerlinked-facilities-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setDone(null);
    setRows([]);
    setHeaders([]);
    setHeaderMap({});

    let records: Record<string, string>[] = [];
    let cols: string[] = [];

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file. In Excel, use File → Save As → CSV (UTF-8).");
      return;
    }
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    records = parsed.data;
    cols = parsed.meta.fields ?? [];

    const map = mapHeaders(cols);
    setHeaders(cols);
    setHeaderMap(map);
    setRows(records.map((r) => mapRow(r, map)));
  };

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setHeaderMap({});
    setRows([]);
    setDone(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runImport = async () => {
    if (!user?.id) {
      toast.error("Not signed in");
      return;
    }
    setImporting(true);
    setProgress(10);

    const payloadRows = validRows.map((r) => ({
      parent_company: r.mapped.parent_company ?? null,
      name: r.mapped.name,
      tagline: r.mapped.tagline ?? null,
      address_line1: r.mapped.address_line1 ?? null,
      city: r.mapped.city ?? null,
      state: r.mapped.state ?? null,
      zip: r.mapped.zip ?? null,
      phone: r.mapped.phone ?? null,
      website: r.mapped.website ?? null,
      description: r.mapped.description ?? null,
      capacity: r.mapped.capacity ?? null,
      levels_of_care: r.mapped.levels_of_care ?? [],
      highlights: r.mapped.highlights ?? [],
      image_urls: r.mapped.image_urls ?? [],
      bd_contact_name: r.mapped.bd_contact_name ?? null,
      bd_contact_phone: r.mapped.bd_contact_phone ?? null,
      bd_contact_email: r.mapped.bd_contact_email ?? null,
      payers_in_network: r.mapped.payers_in_network ?? [],
      payers_out_of_network: r.mapped.payers_out_of_network ?? [],
    }));

    setProgress(40);
    const { data, error } = await supabase.functions.invoke("import-facilities", {
      body: {
        rows: payloadRows,
        fallback_organization_id: profile?.organization_id ?? null,
      },
    });
    setProgress(100);
    setImporting(false);

    if (error) {
      toast.error("Import failed", { description: error.message });
      setDone({ ok: 0, failed: validRows.length });
      return;
    }

    const ok = (data as any)?.ok ?? 0;
    const failed = (data as any)?.failed ?? 0;
    const orgs = (data as any)?.organizations_created ?? 0;
    setDone({ ok, failed });
    toast.success(`${ok} facilities imported across ${orgs} organizations${failed ? `, ${failed} failed` : ""}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Import Facilities</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Bulk-add facilities and their in-network payers from a spreadsheet. BD rep
            details are optional — you can fill them in later from each facility page.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Download CSV template
        </Button>
      </div>

      {/* Upload card */}
      {!fileName ? (
        <Card
          className="border-dashed border-2 p-10 text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold">Drop your spreadsheet here, or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">CSV files only (export from Excel as CSV)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </Card>
      ) : (
        <>
          <Card className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} rows · {validRows.length} ready · {invalidRows.length} with issues
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                <X className="h-4 w-4" /> Clear
              </Button>
              <Button
                size="sm"
                disabled={importing || validRows.length === 0 || !!done}
                onClick={runImport}
              >
                <Sparkles className="h-4 w-4" />
                {importing ? "Importing…" : `Import ${validRows.length} facilities`}
              </Button>
            </div>
          </Card>

          {/* Column mapping summary */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Column mapping</h2>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(headerMap).length} of {headers.length} matched
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {headers.map((h) => (
                <div
                  key={h}
                  className="flex items-center justify-between text-sm border border-border/60 rounded-md px-3 py-2"
                >
                  <span className="truncate">{h}</span>
                  {headerMap[h] ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {headerMap[h]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">ignored</span>
                  )}
                </div>
              ))}
            </div>
            {unmappedHeaders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Unmatched columns are skipped. Rename them to match the template headers if
                you want them imported.
              </p>
            )}
          </Card>

          {/* Issues */}
          {invalidRows.length > 0 && (
            <Card className="p-4 sm:p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="font-semibold">{invalidRows.length} rows have issues and will be skipped</h2>
              </div>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {invalidRows.slice(0, 10).map((r, i) => (
                  <li key={i}>
                    Row {rows.indexOf(r) + 2}: {r.errors.join(", ")}
                  </li>
                ))}
                {invalidRows.length > 10 && (
                  <li className="text-muted-foreground">…and {invalidRows.length - 10} more</li>
                )}
              </ul>
            </Card>
          )}

          {/* Preview */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-semibold">Preview</h2>
              <span className="text-xs text-muted-foreground">First 25 rows</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent / Org</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Levels</TableHead>
                    <TableHead>In-Network Payers</TableHead>
                    <TableHead className="w-20 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 25).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs">{i + 2}</TableCell>
                      <TableCell className="font-medium">{r.mapped.name || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {r.mapped.parent_company || <span className="text-muted-foreground italic">your org</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[r.mapped.city, r.mapped.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.mapped.levels_of_care ?? []).slice(0, 3).map((l: string) => (
                            <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {(r.mapped.payers_in_network ?? []).slice(0, 4).join(", ") || "—"}
                        {(r.mapped.payers_in_network ?? []).length > 4 &&
                          ` +${r.mapped.payers_in_network.length - 4}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.errors.length === 0 ? (
                          <Badge className="bg-success/15 text-success border-success/30">Ready</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Skip</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {(importing || done) && (
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {done ? "Import complete" : "Importing…"}
                </p>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
              {done && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm">
                    <span className="text-success font-semibold">{done.ok}</span> imported
                    {done.failed > 0 && (
                      <>
                        {" · "}
                        <span className="text-destructive font-semibold">{done.failed}</span> failed
                      </>
                    )}
                  </p>
                  <Button size="sm" onClick={() => navigate("/app/facilities")}>
                    View facilities
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* How it works */}
      <Card className="p-5 bg-muted/30 border-dashed">
        <h3 className="font-semibold mb-2">Spreadsheet tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Use the template above for the cleanest import — but any column names matching the canonical names will work.</li>
          <li><strong>Parent Company</strong> drives the organization. Each unique parent company becomes its own organization, and that facility (program) is linked to it. Rows with no parent company go under your own organization.</li>
          <li>For lists (Levels of Care, Highlights, Payers, Image URLs), separate values with a semicolon: <code className="text-foreground">Detox; Residential; PHP</code></li>
          <li>Imported facilities start as <strong>pending verification</strong> — same as facilities added manually.</li>
          <li>BD rep fields are optional. You can add them per-facility once you're set up.</li>
        </ul>
      </Card>
    </div>
  );
}
