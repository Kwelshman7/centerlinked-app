import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/app/ImageUploader";
import { programPublicPath } from "@/lib/public-urls";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Building2, Loader2, Lock, Upload, Wand2,
  Plus, Trash2, CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import {
  LEVELS_OF_CARE, HIGHLIGHT_OPTIONS, POPULATION_OPTIONS,
  SPECIALIZATION_OPTIONS, ACCREDITATION_OPTIONS,
} from "@/components/app/facility/facility-types";
import { assertImageFile, assertPdfFile } from "@/lib/upload-guards";
import { buildFacilityContractDrafts } from "@/lib/match-payer";
import { loadApprovedPayers } from "@/lib/load-approved-payers";
import { sendOrgWelcomeEmail } from "@/lib/transactional-email";
import { saveFacilityWithContracts } from "@/lib/save-facility";
import { parsedFacilityContractDrafts, type ParsedFacility, type ParsedPdfPayload } from "@/lib/pdf-import";
import {
  extractEmbeddedPdfImages,
  suggestLogoImageId,
  type EmbeddedPdfImage,
} from "@/lib/pdf-embedded-images";

type Stage = "create-org" | "add-facilities" | "done";

interface ManualFacility {
  name: string;
  tagline: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  description: string;
  capacity: string;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations: string[];
  bd_contact_name: string;
  bd_contact_phone: string;
  bd_contact_email: string;
  image_urls: string[];
  payers_in_network: string; // comma-separated input
  payers_out_of_network: string;
}

const emptyFacility = (): ManualFacility => ({
  name: "", tagline: "", address_line1: "", city: "", state: "", zip: "",
  phone: "", website: "", description: "", capacity: "",
  levels_of_care: [], highlights: [], population_served: [],
  specializations: [], accreditations: [],
  bd_contact_name: "", bd_contact_phone: "", bd_contact_email: "",
  image_urls: [], payers_in_network: "", payers_out_of_network: "",
});

type PdfImageAssignment = "logo" | "none" | number;

interface StagedPdfImage {
  id: string;
  width: number;
  height: number;
  mime: EmbeddedPdfImage["mime"];
  bytes: Uint8Array;
  previewUrl: string;
  assignment: PdfImageAssignment;
}

const LEVEL_ALIASES: Record<string, string> = {
  detoxification: "Detox",
  "medical detox": "Detox",
  "residential treatment": "Residential",
  rtc: "Residential",
  "partial hospitalization": "PHP",
  "partial hospitalization program": "PHP",
  "intensive outpatient": "IOP",
  "intensive outpatient program": "IOP",
  "sober living home": "Sober Living",
  "medication-assisted treatment": "MAT",
  "medication assisted treatment": "MAT",
};

function splitLabels(raw: string[] | undefined): string[] {
  return (raw ?? []).flatMap((item) =>
    item.split(/[,;/|•]/).map((part) => part.trim()).filter(Boolean),
  );
}

function matchLabels(
  raw: string[] | undefined,
  allowed: readonly string[],
  aliases: Record<string, string> = {},
): string[] {
  const out: string[] = [];
  for (const item of splitLabels(raw)) {
    const key = item.toLowerCase();
    const exact = allowed.find((label) => label.toLowerCase() === key);
    const mapped = exact ?? aliases[key];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

function websiteValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function imageExt(mime: string): string {
  return mime === "image/png" ? "png" : "jpg";
}

function facilitiesFromParsed(rows: ParsedFacility[]): ManualFacility[] {
  return rows.map((row) => ({
    ...emptyFacility(),
    name: row.name ?? "",
    tagline: row.tagline ?? "",
    address_line1: row.address_line1 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
    phone: row.phone ?? "",
    website: websiteValue(row.website),
    description: row.description ?? "",
    capacity: row.capacity != null ? String(row.capacity) : "",
    levels_of_care: matchLabels(row.levels_of_care, LEVELS_OF_CARE, LEVEL_ALIASES),
    highlights: matchLabels(row.highlights, HIGHLIGHT_OPTIONS),
    bd_contact_name: row.bd_contact_name ?? "",
    bd_contact_phone: row.bd_contact_phone ?? "",
    bd_contact_email: row.bd_contact_email ?? "",
    payers_in_network: (row.payers_in_network ?? []).join(", "),
    payers_out_of_network: (row.payers_out_of_network ?? []).join(", "),
  }));
}

function stagePdfImages(images: EmbeddedPdfImage[], facilityCount: number): StagedPdfImage[] {
  const logoId = suggestLogoImageId(images);
  let photoSlot = 0;
  return images.map((img) => {
    let assignment: PdfImageAssignment = "none";
    if (img.id === logoId) assignment = "logo";
    else if (facilityCount > 0) {
      assignment = photoSlot % facilityCount;
      photoSlot += 1;
    }
    return {
      ...img,
      previewUrl: URL.createObjectURL(new Blob([img.bytes], { type: img.mime })),
      assignment,
    };
  });
}

function releasePdfImages(images: StagedPdfImage[]) {
  for (const img of images) URL.revokeObjectURL(img.previewUrl);
}

async function uploadImageBytes(
  bucket: "org-logos" | "facility-images",
  bytes: Uint8Array,
  mime: string,
  path: string,
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, new Blob([bytes], { type: mime }), {
    contentType: mime,
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || null;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function edgeFunctionMessage(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === "object") {
    const rec = data as { error?: unknown; message?: unknown };
    if (typeof rec.error === "string" && rec.error.trim()) return rec.error;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
  }
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await (typeof ctx.clone === "function" ? ctx.clone() : ctx).json();
      if (typeof body?.error === "string" && body.error.trim()) return body.error;
      if (typeof body?.message === "string" && body.message.trim()) return body.message;
    } catch {
      /* ignore */
    }
  }
  return error instanceof Error ? error.message : "Parse failed";
}

export default function AdminCreateOrganization() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("create-org");
  const [creating, setCreating] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  const [orgForm, setOrgForm] = useState({
    name: "", email_domain: "", website: "", hq_city: "", hq_state: "",
    description: "", phone: "",
    bd_contact_name: "", bd_contact_phone: "", bd_contact_email: "",
    logo_url: "", verified: false,
  });

  // Duplicate-name check
  const [nameMatches, setNameMatches] = useState<{ id: string; name: string; hq_city: string | null; hq_state: string | null }[]>([]);
  const [dupConfirmed, setDupConfirmed] = useState(false);

  useEffect(() => {
    const trimmed = orgForm.name.trim();
    if (trimmed.length < 3) { setNameMatches([]); setDupConfirmed(false); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id,name,hq_city,hq_state")
        .ilike("name", `%${trimmed}%`)
        .limit(5);
      setNameMatches((data as typeof nameMatches) ?? []);
      setDupConfirmed(false);
    }, 400);
    return () => clearTimeout(t);
  }, [orgForm.name]);

  // Manual flow state
  const [manualFacilities, setManualFacilities] = useState<ManualFacility[]>([emptyFacility()]);
  const [savingManual, setSavingManual] = useState(false);
  const [createdFacilityUrls, setCreatedFacilityUrls] = useState<string[]>([]);
  const [importingPdf, setImportingPdf] = useState(false);
  const [pdfImported, setPdfImported] = useState(false);
  const [pdfImages, setPdfImages] = useState<StagedPdfImage[]>([]);
  const pdfImagesRef = useRef<StagedPdfImage[]>([]);
  pdfImagesRef.current = pdfImages;

  useEffect(() => () => releasePdfImages(pdfImagesRef.current), []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2">Sign in required.</p>
      </Card>
    );
  }
  if (!isSuperAdmin) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2">Super admin access only.</p>
      </Card>
    );
  }

  /* ---------- STAGE 1: create org ---------- */
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim()) {
      toast.error("Organization name required");
      return;
    }
    if (nameMatches.length > 0 && !dupConfirmed) {
      toast.error("Confirm this isn't a duplicate before creating", {
        description: "Check the matching organizations below and tick the confirmation checkbox.",
      });
      return;
    }
    setCreating(true);
    let logoUrl = orgForm.logo_url;
    if (!logoUrl) {
      const logo = pdfImages.find((img) => img.assignment === "logo");
      if (logo) {
        const uploaded = await uploadImageBytes(
          "org-logos",
          logo.bytes,
          logo.mime,
          `admin-staged/${crypto.randomUUID()}.${imageExt(logo.mime)}`,
        );
        if (uploaded) logoUrl = uploaded;
        else toast.error("Couldn't upload the logo from the PDF. You can add it after the organization is created.");
      }
    }
    const { data, error } = await supabase.rpc("admin_create_organization", {
      _name: orgForm.name.trim(),
      _email_domain: orgForm.email_domain.trim() || null,
      _website: orgForm.website.trim() || null,
      _hq_city: orgForm.hq_city.trim() || null,
      _hq_state: orgForm.hq_state.trim() || null,
      _description: orgForm.description.trim() || null,
      _phone: orgForm.phone.trim() || null,
      _num_facilities: null,
      _logo_url: logoUrl || null,
      _bd_contact_name: orgForm.bd_contact_name.trim() || null,
      _bd_contact_phone: orgForm.bd_contact_phone.trim() || null,
      _bd_contact_email: orgForm.bd_contact_email.trim() || null,
      _verified: orgForm.verified,
    });
    if (error) {
      setCreating(false);
      toast.error(error.message);
      return;
    }
    const newId = data as string;
    const { data: orgRow } = await supabase
      .from("organizations").select("slug").eq("id", newId).maybeSingle();
    setOrgId(newId);
    setOrgName(orgForm.name.trim());
    setOrgSlug(orgRow?.slug ?? null);
    setStage("add-facilities");
    setCreating(false);

    if (orgForm.verified) {
      try {
        const result = await sendOrgWelcomeEmail({
          organization_id: newId,
          to_email: orgForm.bd_contact_email.trim() || undefined,
          to_name: orgForm.bd_contact_name.trim() || undefined,
        });
        toast.success("Organization created", {
          description: result.to
            ? `Welcome email sent to ${result.to}`
            : "Welcome email sent",
        });
      } catch (emailErr) {
        toast.success("Organization created", {
          description:
            emailErr instanceof Error
              ? `Created, but welcome email failed: ${emailErr.message}`
              : "Created, but welcome email failed",
        });
      }
    } else {
      toast.success("Organization created");
    }
  };

  /* ---------- Logo upload ---------- */
  const uploadLogo = async (file: File) => {
    if (!file) return;
    const imageCheck = assertImageFile(file);
    if (!imageCheck.ok) {
      toast.error(imageCheck.error);
      return;
    }
    const path = `admin-staged/${crypto.randomUUID()}.${imageCheck.ext}`;
    const { error } = await supabase.storage.from("org-logos")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setOrgForm((p) => ({ ...p, logo_url: data.publicUrl }));
    toast.success("Logo uploaded");
    setPdfImages((prev) => prev.map((img) => (img.assignment === "logo" ? { ...img, assignment: "none" } : img)));
  };

  const assignPdfImage = (id: string, assignment: PdfImageAssignment) => {
    setPdfImages((prev) => prev.map((img) => {
      if (img.id === id) return { ...img, assignment };
      if (assignment === "logo" && img.assignment === "logo") return { ...img, assignment: "none" };
      return img;
    }));
    if (assignment === "logo") setOrgForm((p) => ({ ...p, logo_url: "" }));
  };

  const importPdf = async (file: File) => {
    const pdfCheck = await assertPdfFile(file);
    if (!pdfCheck.ok) {
      toast.error(pdfCheck.error);
      return;
    }
    setImportingPdf(true);
    try {
      const pdfBytes = new Uint8Array(await file.arrayBuffer());
      const pdf_base64 = await fileToBase64(file);
      let data: unknown;
      let error: unknown;
      ({ data, error } = await supabase.functions.invoke("parse-facility-pdf", {
        body: { pdf_base64, filename: file.name },
      }));
      let message = await edgeFunctionMessage(error, data);
      const parsedError = data && typeof data === "object" ? (data as { error?: string }).error : undefined;
      if ((error || parsedError) && /storage_path is required/i.test(message)) {
        const path = `${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("facility-pdfs")
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (upErr) throw new Error(upErr.message);
        ({ data, error } = await supabase.functions.invoke("parse-facility-pdf", {
          body: { storage_path: path, filename: file.name },
        }));
        message = await edgeFunctionMessage(error, data);
      }
      const parseResult = data as (ParsedPdfPayload & { error?: string }) | null;
      if (error || parseResult?.error) throw new Error(message);
      if (!parseResult?.facilities?.length) throw new Error("No facilities detected in the PDF");

      const nextFacilities = facilitiesFromParsed(parseResult.facilities);
      const org = parseResult.organization;
      const firstBd = nextFacilities.find((row) => row.bd_contact_name || row.bd_contact_email || row.bd_contact_phone);
      setOrgForm((prev) => ({
        ...prev,
        name: org?.name?.trim() || prev.name,
        website: websiteValue(org?.website) || prev.website,
        description: org?.description?.trim() || prev.description,
        phone: org?.phone?.trim() || prev.phone,
        hq_city: org?.hq_city?.trim() || prev.hq_city,
        hq_state: org?.hq_state?.trim() || prev.hq_state,
        bd_contact_name: firstBd?.bd_contact_name || prev.bd_contact_name,
        bd_contact_phone: firstBd?.bd_contact_phone || prev.bd_contact_phone,
        bd_contact_email: firstBd?.bd_contact_email || prev.bd_contact_email,
        logo_url: "",
      }));
      setManualFacilities(nextFacilities.length ? nextFacilities : [emptyFacility()]);
      setPdfImported(true);
      const staged = stagePdfImages(await extractEmbeddedPdfImages(pdfBytes), nextFacilities.length);
      setPdfImages((prev) => {
        releasePdfImages(prev);
        return staged;
      });
      const logo = staged.find((img) => img.assignment === "logo");
      const photoCount = staged.filter((img) => typeof img.assignment === "number").length;
      toast.success(
        `Read ${nextFacilities.length} location${nextFacilities.length === 1 ? "" : "s"} from ${file.name}`,
        {
          description: [
            logo ? "Logo selected — confirm it below." : "No logo image found. Upload one if the PDF has it as a separate file.",
            photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"} ready for the facilities.` : "No facility photos found in the PDF.",
            "Nothing is saved until you create the organization.",
          ].join(" "),
        },
      );
    } catch (err) {
      toast.error("Couldn't read that PDF", {
        description: err instanceof Error ? err.message : "Try a clearer one-pager.",
      });
    } finally {
      setImportingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  /* ---------- STAGE 2: add facilities ---------- */
  const updateManual = (idx: number, patch: Partial<ManualFacility>) => {
    setManualFacilities((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };
  const togglePill = (idx: number, key: keyof ManualFacility, value: string) => {
    setManualFacilities((prev) => prev.map((f, i) => {
      if (i !== idx) return f;
      const cur = (f[key] as string[]) ?? [];
      return {
        ...f,
        [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    }));
  };
  const addManual = () => setManualFacilities((p) => [...p, emptyFacility()]);
  const removeManual = (idx: number) => {
    setManualFacilities((p) => p.filter((_, i) => i !== idx));
    setPdfImages((prev) => prev.map((img) => {
      if (typeof img.assignment !== "number") return img;
      if (img.assignment === idx) return { ...img, assignment: "none" };
      if (img.assignment > idx) return { ...img, assignment: img.assignment - 1 };
      return img;
    }));
  };

  const saveManual = async () => {
    if (!orgId || !user) return;
    if (manualFacilities.some((f) => !f.name.trim())) {
      toast.error("Every facility needs a name");
      return;
    }
    setSavingManual(true);
    const urls: string[] = [];
    const failed: { name: string; error: string }[] = [];
    let photoFailures = 0;
    try {
      const payers = await loadApprovedPayers();
      for (let idx = 0; idx < manualFacilities.length; idx++) {
        const f = manualFacilities[idx];
        const ins = f.payers_in_network.split(",").map((s) => s.trim()).filter(Boolean);
        const oon = f.payers_out_of_network.split(",").map((s) => s.trim()).filter(Boolean);
        const imageUrls = [...f.image_urls];
        for (const img of pdfImages) {
          if (img.assignment !== idx) continue;
          const uploaded = await uploadImageBytes(
            "facility-images",
            img.bytes,
            img.mime,
            `${user.id}/${Date.now()}-${img.id}.${imageExt(img.mime)}`,
          );
          if (uploaded && !imageUrls.includes(uploaded)) imageUrls.push(uploaded);
          else if (!uploaded) photoFailures += 1;
        }
        const contracts = pdfImported
          ? parsedFacilityContractDrafts(
              { name: f.name, payers_in_network: ins, payers_out_of_network: oon },
              payers,
            )
          : [
              ...buildFacilityContractDrafts(ins, true, payers),
              ...buildFacilityContractDrafts(oon, false, payers),
            ];
        const draft = {
          ...emptyFacility(),
          name: f.name.trim(),
          tagline: f.tagline.trim(),
          address_line1: f.address_line1.trim(),
          city: f.city.trim(),
          state: f.state.trim(),
          zip: f.zip.trim(),
          phone: f.phone.trim(),
          website: f.website.trim(),
          description: f.description.trim(),
          capacity: f.capacity,
          levels_of_care: f.levels_of_care,
          highlights: f.highlights,
          population_served: f.population_served,
          specializations: f.specializations,
          accreditations: f.accreditations,
          bd_contact_name: f.bd_contact_name.trim(),
          bd_contact_phone: f.bd_contact_phone.trim(),
          bd_contact_email: f.bd_contact_email.trim(),
          image_urls: imageUrls,
          contracts,
        };
        const result = await saveFacilityWithContracts({
          organizationId: orgId,
          draft,
          contractsMode: "all",
        });
        if (!result.ok) {
          failed.push({ name: f.name.trim(), error: result.error });
          continue;
        }
        if (result.slug) urls.push(programPublicPath(result.slug, orgSlug));
      }
      if (failed.length) {
        toast.error(
          `${urls.length} saved, ${failed.length} failed`,
          { description: failed.map((x) => `${x.name}: ${x.error}`).join(" · ") },
        );
        return;
      }
      setCreatedFacilityUrls(urls);
      setStage("done");
      toast.success(`${manualFacilities.length} facility${manualFacilities.length === 1 ? "" : "s"} created`, photoFailures
        ? { description: `${photoFailures} photo${photoFailures === 1 ? "" : "s"} from the PDF could not be uploaded.` }
        : undefined);
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't save facilities");
    } finally {
      setSavingManual(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/app/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2 mt-1">
            <Building2 className="h-7 w-7 text-primary" />
            Add an organization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Super-admin tool. Import a one-pager to fill the organization, locations, insurance, levels of care, logo, and photos — or enter them by hand.
          </p>
        </div>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center gap-3 text-xs">
        {(["create-org", "add-facilities", "done"] as const).map((s, i) => {
          const active = stage === s;
          const done =
            (s === "create-org" && stage !== "create-org") ||
            (s === "add-facilities" && stage === "done");
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 grid place-items-center rounded-full text-[11px] font-semibold border ${
                done ? "bg-success/15 border-success/40 text-success"
                  : active ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={active || done ? "font-medium" : "text-muted-foreground"}>
                {s === "create-org" ? "Organization" : s === "add-facilities" ? "Facilities" : "Done"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {/* STAGE 1 */}
      {stage === "create-org" && (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleCreateOrg} className="space-y-5">
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Import PDF</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reads locations, insurance, levels of care, the logo, and photos. You confirm every field before anything is saved.
                </p>
              </div>
              <Button type="button" variant="outline" disabled={importingPdf || creating} onClick={() => pdfInputRef.current?.click()}>
                {importingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {importingPdf ? "Reading PDF…" : "Import PDF"}
              </Button>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importPdf(file);
                }}
              />
            </div>
            {pdfImported && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium">
                  {manualFacilities.length} location{manualFacilities.length === 1 ? "" : "s"} ready after you create the organization
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {manualFacilities.map((facility, idx) => (
                    <li key={`${facility.name}-${idx}`}>
                      {facility.name || `Facility ${idx + 1}`}
                      {facility.city || facility.state ? ` — ${[facility.city, facility.state].filter(Boolean).join(", ")}` : ""}
                      {facility.levels_of_care.length ? ` · ${facility.levels_of_care.join(", ")}` : ""}
                      {facility.payers_in_network ? ` · ${facility.payers_in_network}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">Organization name *</Label>
                <Input id="name" autoFocus value={orgForm.name}
                  onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Acme Recovery Network" required />

                {nameMatches.length > 0 && (
                  <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-2.5">
                    <div className="flex items-center gap-2 text-warning-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      <p className="text-sm font-semibold">
                        {nameMatches.length === 1
                          ? "1 existing organization matches this name"
                          : `${nameMatches.length} existing organizations match this name`}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {nameMatches.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium text-foreground">{m.name}</span>
                          {(m.hq_city || m.hq_state) && (
                            <span>— {[m.hq_city, m.hq_state].filter(Boolean).join(", ")}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <label className="flex items-start gap-2.5 cursor-pointer pl-6">
                      <input
                        type="checkbox"
                        checked={dupConfirmed}
                        onChange={(e) => setDupConfirmed(e.target.checked)}
                        className="mt-0.5 accent-primary"
                      />
                      <span className="text-sm text-muted-foreground">
                        I've reviewed these and confirmed this is a <strong>different organization</strong> — not a duplicate.
                      </span>
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Email domain</Label>
                <Input id="domain" value={orgForm.email_domain}
                  onChange={(e) => setOrgForm((p) => ({ ...p, email_domain: e.target.value }))}
                  placeholder="acmerecovery.com" />
                <p className="text-[11px] text-muted-foreground">Optional. Used to auto-join staff who sign up with this domain.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Main phone</Label>
                <Input id="phone" value={orgForm.phone}
                  onChange={(e) => setOrgForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={orgForm.website}
                  onChange={(e) => setOrgForm((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">HQ city</Label>
                <Input id="city" value={orgForm.hq_city}
                  onChange={(e) => setOrgForm((p) => ({ ...p, hq_city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">HQ state</Label>
                <Input id="state" value={orgForm.hq_state}
                  onChange={(e) => setOrgForm((p) => ({ ...p, hq_state: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} value={orgForm.description}
                  onChange={(e) => setOrgForm((p) => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {(orgForm.logo_url || pdfImages.some((img) => img.assignment === "logo")) ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white border">
                      <img
                        src={orgForm.logo_url || pdfImages.find((img) => img.assignment === "logo")?.previewUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                      <button type="button"
                        onClick={() => {
                          setOrgForm((p) => ({ ...p, logo_url: "" }));
                          setPdfImages((prev) => prev.map((img) => (img.assignment === "logo" ? { ...img, assignment: "none" } : img)));
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-foreground/70 text-background">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted grid place-items-center text-muted-foreground">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> {orgForm.logo_url ? "Replace" : "Upload logo"}
                  </Button>
                  <input ref={logoRef} type="file" accept="image/*" hidden
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </div>
                {pdfImages.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Images from the PDF. Choose the logo, or assign a photo to a location. Wide photos are left as facility images.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pdfImages.map((img) => (
                        <div key={img.id} className="space-y-1.5">
                          <div className="aspect-square rounded-lg border bg-white overflow-hidden">
                            <img src={img.previewUrl} alt="" className="h-full w-full object-contain" />
                          </div>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                            value={img.assignment === "logo" || img.assignment === "none" ? img.assignment : String(img.assignment)}
                            onChange={(e) => {
                              const value = e.target.value;
                              assignPdfImage(img.id, value === "logo" || value === "none" ? value : Number(value));
                            }}
                          >
                            <option value="logo">Organization logo</option>
                            <option value="none">Skip</option>
                            {manualFacilities.map((facility, idx) => (
                              <option key={idx} value={idx}>
                                Photo: {facility.name || `Facility ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 pt-3 border-t">
                <p className="text-sm font-semibold mb-3">Referral contact (optional)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="bdn">BD rep name</Label>
                    <Input id="bdn" value={orgForm.bd_contact_name}
                      onChange={(e) => setOrgForm((p) => ({ ...p, bd_contact_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bdp">BD phone</Label>
                    <Input id="bdp" value={orgForm.bd_contact_phone}
                      onChange={(e) => setOrgForm((p) => ({ ...p, bd_contact_phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bde">BD email</Label>
                    <Input id="bde" type="email" value={orgForm.bd_contact_email}
                      onChange={(e) => setOrgForm((p) => ({ ...p, bd_contact_email: e.target.value }))} />
                  </div>
                </div>
              </div>

              <label className="sm:col-span-2 flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={orgForm.verified}
                  onChange={(e) => setOrgForm((p) => ({ ...p, verified: e.target.checked }))} />
                Mark as verified immediately
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={creating || importingPdf}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create organization <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </Card>
      )}

      {/* STAGE 2 */}
      {stage === "add-facilities" && orgId && (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{orgName} created</p>
              <p className="text-xs text-muted-foreground">
                {pdfImported
                  ? "Review the locations, insurance, levels of care, and photos from the PDF, then save."
                  : "Now add facilities — by PDF (fast) or by hand."}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setStage("done"); setCreatedFacilityUrls([]); }}>
              Skip for now
            </Button>
          </div>

          <Tabs defaultValue={pdfImported ? "manual" : "pdf"}>
            <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-2">
              <TabsTrigger value="pdf"><Wand2 className="h-3.5 w-3.5" /> Upload PDF</TabsTrigger>
              <TabsTrigger value="manual"><Plus className="h-3.5 w-3.5" /> Add manually</TabsTrigger>
            </TabsList>

            {/* PDF TAB */}
            <TabsContent value="pdf" className="mt-4 space-y-4">
              <Card className="p-8 text-center space-y-3">
                <Wand2 className="h-8 w-8 mx-auto text-primary" />
                <p className="font-semibold">Import facilities from a PDF</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Review extracted locations and insurance before saving. Existing facilities are matched so we add payers instead of creating duplicates.
                </p>
                <Button asChild>
                  <Link to={`/app/facilities/upload-pdf?orgId=${orgId}`}>
                    <Wand2 className="h-4 w-4" /> Upload PDF for {orgName}
                  </Link>
                </Button>
              </Card>
            </TabsContent>

            {/* MANUAL TAB */}
            <TabsContent value="manual" className="mt-4 space-y-4">
              {manualFacilities.map((f, idx) => (
                <Card key={idx} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Facility {idx + 1}</p>
                    {manualFacilities.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeManual(idx)}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={f.name} onChange={(e) => updateManual(idx, { name: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Tagline</Label>
                      <Input value={f.tagline} onChange={(e) => updateManual(idx, { tagline: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Address</Label>
                      <Input value={f.address_line1} onChange={(e) => updateManual(idx, { address_line1: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input value={f.city} onChange={(e) => updateManual(idx, { city: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>State</Label>
                        <Input value={f.state} onChange={(e) => updateManual(idx, { state: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>ZIP</Label>
                        <Input value={f.zip} onChange={(e) => updateManual(idx, { zip: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={f.phone} onChange={(e) => updateManual(idx, { phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <Input type="url" value={f.website} onChange={(e) => updateManual(idx, { website: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Capacity</Label>
                      <Input type="number" value={f.capacity} onChange={(e) => updateManual(idx, { capacity: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Description</Label>
                      <Textarea rows={3} value={f.description} onChange={(e) => updateManual(idx, { description: e.target.value })} />
                    </div>
                  </div>

                  <PillSelector label="Levels of care" options={LEVELS_OF_CARE as unknown as string[]}
                    selected={f.levels_of_care} onToggle={(v) => togglePill(idx, "levels_of_care", v)} />
                  <PillSelector label="Population" options={POPULATION_OPTIONS as unknown as string[]}
                    selected={f.population_served} onToggle={(v) => togglePill(idx, "population_served", v)} />
                  <PillSelector label="Type of therapy" options={SPECIALIZATION_OPTIONS as unknown as string[]}
                    selected={f.specializations} onToggle={(v) => togglePill(idx, "specializations", v)} />
                  <PillSelector label="Amenities" options={HIGHLIGHT_OPTIONS as unknown as string[]}
                    selected={f.highlights} onToggle={(v) => togglePill(idx, "highlights", v)} />
                  <PillSelector label="Accreditations" options={ACCREDITATION_OPTIONS as unknown as string[]}
                    selected={f.accreditations} onToggle={(v) => togglePill(idx, "accreditations", v)} />

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>In-network insurance (comma separated)</Label>
                      <Textarea rows={2} placeholder="Aetna, Cigna, BCBS, …"
                        value={f.payers_in_network}
                        onChange={(e) => updateManual(idx, { payers_in_network: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Out-of-network only (comma separated)</Label>
                      <Textarea rows={2} value={f.payers_out_of_network}
                        onChange={(e) => updateManual(idx, { payers_out_of_network: e.target.value })} />
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-3">
                    <p className="text-sm font-semibold">Referral contact</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input placeholder="Name" value={f.bd_contact_name}
                        onChange={(e) => updateManual(idx, { bd_contact_name: e.target.value })} />
                      <Input placeholder="Phone" value={f.bd_contact_phone}
                        onChange={(e) => updateManual(idx, { bd_contact_phone: e.target.value })} />
                      <Input placeholder="Email" type="email" value={f.bd_contact_email}
                        onChange={(e) => updateManual(idx, { bd_contact_email: e.target.value })} />
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <Label>Photos</Label>
                    <ImageUploader bucket="facility-images" value={f.image_urls}
                      onChange={(v) => updateManual(idx, { image_urls: v })} max={6} />
                  </div>
                </Card>
              ))}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={addManual}><Plus className="h-4 w-4" /> Add another facility</Button>
                <Button onClick={saveManual} disabled={savingManual} size="lg">
                  {savingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Save facilities</>}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* STAGE 3 */}
      {stage === "done" && (
        <Card className="p-8 space-y-4 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
          <h2 className="font-heading text-xl font-bold">{orgName} is ready</h2>
          {createdFacilityUrls.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {createdFacilityUrls.length} facility page{createdFacilityUrls.length === 1 ? "" : "s"} created.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {orgSlug && (
              <Button asChild variant="outline">
                <Link to={`/o/${orgSlug}`} target="_blank">View organization page</Link>
              </Button>
            )}
            <Button onClick={() => navigate("/app/dashboard")}>Back to dashboard</Button>
            <Button variant="ghost" onClick={() => {
              setStage("create-org"); setOrgId(null); setOrgName(""); setOrgSlug(null);
              setOrgForm({
                name: "", email_domain: "", website: "", hq_city: "", hq_state: "",
                description: "", phone: "", bd_contact_name: "", bd_contact_phone: "",
                bd_contact_email: "", logo_url: "", verified: false,
              });
              setManualFacilities([emptyFacility()]); setCreatedFacilityUrls([]);
              releasePdfImages(pdfImages);
              setPdfImages([]);
              setPdfImported(false);
            }}>
              Add another organization
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PillSelector({ label, options, selected, onToggle }: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button key={o} type="button" onClick={() => onToggle(o)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                on ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
