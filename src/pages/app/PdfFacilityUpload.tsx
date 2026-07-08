import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fileToBase64 } from "@/lib/files";
import { programPublicPath } from "@/lib/public-urls";
import { buildInsuranceContractRows } from "@/lib/match-payer";
import { loadApprovedPayers } from "@/lib/load-approved-payers";
import {
  Upload,
  FileText,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  Wand2,
  ArrowRight,
  Building2,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ParsedFacility {
  name: string;
  tagline?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  capacity?: number | null;
  levels_of_care?: string[];
  highlights?: string[];
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  payers_in_network?: string[];
  payers_out_of_network?: string[];
}

interface ParsedPayload {
  organization: {
    name: string;
    website?: string | null;
    description?: string | null;
    phone?: string | null;
    hq_city?: string | null;
    hq_state?: string | null;
  };
  facilities: ParsedFacility[];
}

interface ExtractedImage {
  id: string;
  page: number;
  width: number;
  height: number;
  mime: string;
  data_base64: string;
}


type Stage = "upload" | "parsing" | "review" | "committing" | "done";

export default function PdfFacilityUpload() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedPayload | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [extracting, setExtracting] = useState(false);
  // imageId -> facility index it will attach to ("none" = skip)
  const [imageAssignments, setImageAssignments] = useState<Record<string, number | "none">>({});

  // Gate: must be logged in AND belong to an organization
  if (!user) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Sign in to upload</h2>
        <p className="text-sm text-muted-foreground">PDF uploads are for verified platform users only.</p>
        <Button asChild><Link to="/login">Sign in</Link></Button>
      </Card>
    );
  }
  if (!profile?.organization_id) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Building2 className="h-8 w-8 mx-auto text-primary" />
        <h2 className="font-heading text-xl font-semibold">Create your organization first</h2>
        <p className="text-sm text-muted-foreground">
          PDF uploads are linked to your organization. Set yours up — it takes a minute — then come back.
        </p>
        <Button asChild><Link to="/create-organization">Create organization</Link></Button>
      </Card>
    );
  }


  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF version of your one-pager.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Please upload a PDF under 15MB.");
      return;
    }
    setFileName(file.name);
    setStage("parsing");
    const orgId = profile!.organization_id!;
    try {
      // 1. Upload PDF to private, org-scoped storage (path: <org_id>/<uuid>.pdf)
      const path = `${orgId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("facility-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      setStoragePath(path);

      // 2. Record the upload (RLS enforces it must be tied to the user's org)
      const { data: rec, error: recErr } = await supabase
        .from("facility_pdf_uploads")
        .insert({
          organization_id: orgId,
          uploaded_by: user!.id,
          filename: file.name,
          storage_path: path,
          size_bytes: file.size,
          status: "parsing",
        })
        .select("id")
        .single();
      if (recErr) throw recErr;
      setUploadId(rec.id);

      // 3. Parse with AI vision
      const pdf_base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("parse-facility-pdf", {
        body: { pdf_base64, filename: file.name, upload_id: rec.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const parsedData = data as ParsedPayload;
      setParsed(parsedData);
      await supabase
        .from("facility_pdf_uploads")
        .update({ status: "parsed", parsed_payload: data as any })
        .eq("id", rec.id);
      setStage("review");

      // 4. Kick off image extraction in the background — non-fatal if it fails
      setExtracting(true);
      supabase.functions
        .invoke("extract-pdf-images", { body: { storage_path: path } })
        .then(({ data: imgData, error: imgErr }) => {
          if (imgErr || (imgData as any)?.error) {
            console.warn("image extract failed", imgErr ?? (imgData as any)?.error);
            return;
          }
          const imgs = ((imgData as any)?.images ?? []) as ExtractedImage[];
          setExtractedImages(imgs);
          // Default every image to facility 0 (user can change or skip per image)
          const init: Record<string, number | "none"> = {};
          for (const img of imgs) init[img.id] = parsedData.facilities.length ? 0 : "none";
          setImageAssignments(init);
        })
        .finally(() => setExtracting(false));
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Try a clearer one-pager or fewer pages.";
      toast.error("Couldn't read that PDF", { description: message });
      setStage("upload");
      setFileName("");
    }
  };


  const reset = () => {
    setStage("upload");
    setFileName("");
    setParsed(null);
    setResultUrls([]);
    setExtractedImages([]);
    setImageAssignments({});
    setUploadId(null);
    setStoragePath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleImageAssignment = (imageId: string, value: number | "none") => {
    setImageAssignments((prev) => ({ ...prev, [imageId]: value }));
  };

  // Upload approved images to facility-images bucket and return URLs grouped by facility index
  const uploadApprovedImages = async (orgId: string): Promise<Record<number, string[]>> => {
    const byFacility: Record<number, string[]> = {};
    for (const img of extractedImages) {
      const assignment = imageAssignments[img.id];
      if (assignment === "none" || assignment === undefined) continue;
      const facilityIdx = assignment as number;
      try {
        // base64 -> Blob
        const bin = atob(img.data_base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: img.mime });
        const ext = img.mime === "image/png" ? "png" : "jpg";
        const path = `${orgId}/pdf-${img.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("facility-images")
          .upload(path, blob, { contentType: img.mime, upsert: false });
        if (upErr) {
          console.warn("image upload failed", upErr);
          continue;
        }
        const { data: pub } = supabase.storage.from("facility-images").getPublicUrl(path);
        if (!byFacility[facilityIdx]) byFacility[facilityIdx] = [];
        byFacility[facilityIdx].push(pub.publicUrl);
      } catch (e) {
        console.warn("image upload error", e);
      }
    }
    return byFacility;
  };

  const updateOrg = (patch: Partial<ParsedPayload["organization"]>) => {
    if (!parsed) return;
    setParsed({ ...parsed, organization: { ...parsed.organization, ...patch } });
  };

  const updateFacility = (idx: number, patch: Partial<ParsedFacility>) => {
    if (!parsed) return;
    const next = [...parsed.facilities];
    next[idx] = { ...next[idx], ...patch };
    setParsed({ ...parsed, facilities: next });
  };

  const removeFacility = (idx: number) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      facilities: parsed.facilities.filter((_, i) => i !== idx),
    });
  };

  const commit = async () => {
    if (!parsed || !user) return;
    setStage("committing");
    try {
      // 1. Resolve organization id
      let orgId = profile?.organization_id ?? null;

      if (!orgId) {
        // Try to find an existing org owned by user with the same name
        const { data: existing } = await supabase
          .from("organizations")
          .select("id")
          .eq("created_by", user.id)
          .eq("name", parsed.organization.name)
          .maybeSingle();

        if (existing?.id) {
          orgId = existing.id;
        } else {
          // Create a new org via RPC (this links the user as facility_admin too)
          const emailDomain = (user.email ?? "").split("@")[1] ?? "";
          const { data: newOrgId, error: rpcErr } = await supabase.rpc(
            "create_organization_with_owner",
            {
              _name: parsed.organization.name,
              _email_domain: emailDomain,
              _website: parsed.organization.website ?? null,
              _hq_city: parsed.organization.hq_city ?? null,
              _hq_state: parsed.organization.hq_state ?? null,
              _description: parsed.organization.description ?? null,
              _phone: parsed.organization.phone ?? null,
              _num_facilities: parsed.facilities.length,
              _logo_url: null,
            },
          );
          if (rpcErr) throw rpcErr;
          orgId = newOrgId as string;
        }
      } else {
        // Update existing org with any extracted org-level info that's missing
        await supabase
          .from("organizations")
          .update({
            website: parsed.organization.website ?? undefined,
            phone: parsed.organization.phone ?? undefined,
            hq_city: parsed.organization.hq_city ?? undefined,
            hq_state: parsed.organization.hq_state ?? undefined,
            description: parsed.organization.description ?? undefined,
          })
          .eq("id", orgId);
      }

      // 2. Upload only the user-approved extracted images
      const approvedByFacility = await uploadApprovedImages(orgId!);

      // 3. Insert facilities + contracts
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("slug")
        .eq("id", orgId!)
        .maybeSingle();
      const orgSlug = orgRow?.slug ?? null;

      const payers = await loadApprovedPayers();
      const urls: string[] = [];
      for (let fIdx = 0; fIdx < parsed.facilities.length; fIdx++) {
        const f = parsed.facilities[fIdx];
        const imageUrls = approvedByFacility[fIdx] ?? [];
        const { data: inserted, error: facErr } = await supabase
          .from("facilities")
          .insert({
            organization_id: orgId!,
            submitted_by: user.id,
            name: f.name,
            tagline: f.tagline ?? null,
            address_line1: f.address_line1 ?? null,
            city: f.city ?? null,
            state: f.state ?? null,
            zip: f.zip ?? null,
            phone: f.phone ?? null,
            website: f.website ?? null,
            description: f.description ?? null,
            capacity: f.capacity ?? null,
            levels_of_care: f.levels_of_care ?? [],
            highlights: f.highlights ?? [],
            bd_contact_name: f.bd_contact_name ?? null,
            bd_contact_phone: f.bd_contact_phone ?? null,
            bd_contact_email: f.bd_contact_email ?? null,
            image_urls: imageUrls,
          })
          .select("id, slug")
          .single();
        if (facErr || !inserted) throw facErr ?? new Error("facility insert failed");

        const contracts = [
          ...buildInsuranceContractRows(inserted.id, f.payers_in_network ?? [], true, payers),
          ...buildInsuranceContractRows(inserted.id, f.payers_out_of_network ?? [], false, payers),
        ];
        if (contracts.length) {
          await supabase.from("insurance_contracts").insert(contracts);
        }
        if (inserted.slug) urls.push(programPublicPath(inserted.slug, orgSlug));
      }

      setResultUrls(urls);
      if (uploadId) {
        await supabase
          .from("facility_pdf_uploads")
          .update({ status: "committed", facilities_created: urls.length })
          .eq("id", uploadId);
      }
      setStage("done");
      toast.success(`${parsed.facilities.length} facility page${parsed.facilities.length === 1 ? "" : "s"} created.`);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Please try again.";
      toast.error("Couldn't save", { description: message });
      setStage("review");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-7 w-7 text-primary" />
          Turn your PDF into a live, shareable page
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Upload your facility one-pager. We read it directly — no made-up info — and
          generate a clean, modern page you can share with one link.
        </p>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center gap-2 text-xs">
        {(["upload", "review", "done"] as const).map((s, i) => {
          const active =
            (s === "upload" && stage === "upload") ||
            (s === "review" && (stage === "parsing" || stage === "review" || stage === "committing")) ||
            (s === "done" && stage === "done");
          const done =
            (s === "upload" && stage !== "upload") ||
            (s === "review" && stage === "done");
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 grid place-items-center rounded-full text-[11px] font-semibold border ${
                  done
                    ? "bg-success/15 border-success/40 text-success"
                    : active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={active || done ? "font-medium" : "text-muted-foreground"}>
                {s === "upload" ? "Upload PDF" : s === "review" ? "Confirm details" : "Share link"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          );
        })}
      </div>

      {/* STAGE: UPLOAD */}
      {stage === "upload" && (
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
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center mb-4">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <p className="font-semibold text-lg">Drop your PDF one-pager here</p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse · PDF up to 15MB
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Reads your PDF directly — never makes anything up</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </Card>
      )}

      {/* STAGE: PARSING */}
      {stage === "parsing" && (
        <Card className="p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <div>
            <p className="font-semibold">Reading {fileName}…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Extracting facility info and in-network contracts. Usually 10–30 seconds.
            </p>
          </div>
        </Card>
      )}

      {/* STAGE: REVIEW */}
      {stage === "review" && parsed && (
        <div className="space-y-5">
          <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {parsed.facilities.length} facilit
                  {parsed.facilities.length === 1 ? "y" : "ies"} detected
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4" /> Start over
            </Button>
          </Card>

          {/* Organization */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Organization</h2>
              <Badge variant="secondary" className="text-xs">From PDF</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  value={parsed.organization.name}
                  onChange={(e) => updateOrg({ name: e.target.value })}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={parsed.organization.website ?? ""}
                  onChange={(e) => updateOrg({ website: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={parsed.organization.phone ?? ""}
                  onChange={(e) => updateOrg({ phone: e.target.value })}
                />
              </div>
              <div>
                <Label>HQ City</Label>
                <Input
                  value={parsed.organization.hq_city ?? ""}
                  onChange={(e) => updateOrg({ hq_city: e.target.value })}
                />
              </div>
              <div>
                <Label>HQ State</Label>
                <Input
                  value={parsed.organization.hq_state ?? ""}
                  onChange={(e) => updateOrg({ hq_state: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={parsed.organization.description ?? ""}
                  onChange={(e) => updateOrg({ description: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Facilities */}
          {parsed.facilities.map((f, idx) => (
            <Card key={idx} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading text-lg font-semibold">
                    {f.name || `Facility ${idx + 1}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Facility {idx + 1} of {parsed.facilities.length}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFacility(idx)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={f.name}
                    onChange={(e) => updateFacility(idx, { name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Tagline</Label>
                  <Input
                    value={f.tagline ?? ""}
                    onChange={(e) => updateFacility(idx, { tagline: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={f.address_line1 ?? ""}
                    onChange={(e) => updateFacility(idx, { address_line1: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={f.city ?? ""}
                    onChange={(e) => updateFacility(idx, { city: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>State</Label>
                    <Input
                      value={f.state ?? ""}
                      onChange={(e) => updateFacility(idx, { state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Zip</Label>
                    <Input
                      value={f.zip ?? ""}
                      onChange={(e) => updateFacility(idx, { zip: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={f.phone ?? ""}
                    onChange={(e) => updateFacility(idx, { phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={f.website ?? ""}
                    onChange={(e) => updateFacility(idx, { website: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Levels of Care</Label>
                  <Input
                    value={(f.levels_of_care ?? []).join(", ")}
                    onChange={(e) =>
                      updateFacility(idx, {
                        levels_of_care: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Detox, Residential, PHP"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>In-Network Payers</Label>
                  <Textarea
                    rows={2}
                    value={(f.payers_in_network ?? []).join(", ")}
                    onChange={(e) =>
                      updateFacility(idx, {
                        payers_in_network: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Aetna, Cigna, Blue Cross Blue Shield"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(f.payers_in_network ?? []).map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="bg-success/10 text-success border-success/30"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>BD Contact</Label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <Input
                      value={f.bd_contact_name ?? ""}
                      onChange={(e) =>
                        updateFacility(idx, { bd_contact_name: e.target.value })
                      }
                      placeholder="Name"
                    />
                    <Input
                      value={f.bd_contact_phone ?? ""}
                      onChange={(e) =>
                        updateFacility(idx, { bd_contact_phone: e.target.value })
                      }
                      placeholder="Phone"
                    />
                    <Input
                      value={f.bd_contact_email ?? ""}
                      onChange={(e) =>
                        updateFacility(idx, { bd_contact_email: e.target.value })
                      }
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Photos from PDF — user approves each */}
          {(extracting || extractedImages.length > 0) && (
            <Card className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-heading text-lg font-semibold">Photos from your PDF</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {extracting
                      ? "Looking for photos…"
                      : extractedImages.length === 0
                      ? "No usable photos found in the PDF."
                      : "Pick which photos should appear on your live page. Skip any you don't want included."}
                  </p>
                </div>
                {!extracting && extractedImages.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next: Record<string, number | "none"> = {};
                        for (const img of extractedImages) next[img.id] = 0;
                        setImageAssignments(next);
                      }}
                    >
                      Use all
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next: Record<string, number | "none"> = {};
                        for (const img of extractedImages) next[img.id] = "none";
                        setImageAssignments(next);
                      }}
                    >
                      Skip all
                    </Button>
                  </div>
                )}
              </div>

              {extracting && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              )}

              {!extracting && extractedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {extractedImages.map((img) => {
                    const assignment = imageAssignments[img.id] ?? "none";
                    const skipped = assignment === "none";
                    return (
                      <div
                        key={img.id}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          skipped ? "border-border opacity-50" : "border-primary"
                        }`}
                      >
                        <img
                          src={`data:${img.mime};base64,${img.data_base64}`}
                          alt={`PDF page ${img.page}`}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-medium">
                          p.{img.page}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleImageAssignment(img.id, skipped ? 0 : "none")}
                          className={`absolute top-1 right-1 p-1 rounded-full text-[10px] font-semibold ${
                            skipped
                              ? "bg-primary text-primary-foreground"
                              : "bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                          }`}
                          aria-label={skipped ? "Include this photo" : "Skip this photo"}
                        >
                          {skipped ? <Plus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </button>
                        {!skipped && parsed.facilities.length > 1 && (
                          <select
                            value={assignment as number}
                            onChange={(e) =>
                              toggleImageAssignment(img.id, parseInt(e.target.value, 10))
                            }
                            className="absolute bottom-1 left-1 right-1 text-[10px] bg-background/90 backdrop-blur rounded px-1 py-0.5 border border-border"
                          >
                            {parsed.facilities.map((f, i) => (
                              <option key={i} value={i}>
                                {f.name || `Facility ${i + 1}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Commit bar */}
          <div className="sticky bottom-4 z-10">
            <Card className="p-4 flex items-center justify-between gap-3 flex-wrap shadow-lg border-primary/20">
              <p className="text-sm">
                Looks right? We'll create{" "}
                <span className="font-semibold">
                  {parsed.facilities.length} live page
                  {parsed.facilities.length === 1 ? "" : "s"}
                </span>{" "}
                with shareable links.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={commit}
                  disabled={!parsed.facilities.length || stage !== "review" || extracting}
                >
                  {extracting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Finding photos…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Confirm & create</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE: COMMITTING */}
      {stage === "committing" && (
        <Card className="p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="font-semibold">Creating your pages…</p>
        </Card>
      )}

      {/* STAGE: DONE */}
      {stage === "done" && (
        <Card className="p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/15 grid place-items-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">You're live</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {resultUrls.length} page{resultUrls.length === 1 ? "" : "s"} created and ready to share.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate("/app/facilities")}>
              View my facilities <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={reset}>
              <Plus className="h-4 w-4" /> Upload another PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
