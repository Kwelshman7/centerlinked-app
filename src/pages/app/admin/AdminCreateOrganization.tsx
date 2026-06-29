import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/app/ImageUploader";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Building2, Loader2, Lock, Upload, Sparkles, Wand2,
  Plus, Trash2, CheckCircle2, FileText, X, AlertTriangle,
} from "lucide-react";
import {
  LEVELS_OF_CARE, HIGHLIGHT_OPTIONS, POPULATION_OPTIONS,
  SPECIALIZATION_OPTIONS, ACCREDITATION_OPTIONS,
} from "@/components/app/facility/facility-types";

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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

interface PdfFacility {
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

export default function AdminCreateOrganization() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading } = useAuth();
  const pdfRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

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

  // PDF flow state
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfFilename, setPdfFilename] = useState("");
  const [parsedFacilities, setParsedFacilities] = useState<PdfFacility[] | null>(null);
  const [committing, setCommitting] = useState(false);

  // Manual flow state
  const [manualFacilities, setManualFacilities] = useState<ManualFacility[]>([emptyFacility()]);
  const [savingManual, setSavingManual] = useState(false);
  const [createdFacilityUrls, setCreatedFacilityUrls] = useState<string[]>([]);

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
    const { data, error } = await supabase.rpc("admin_create_organization", {
      _name: orgForm.name.trim(),
      _email_domain: orgForm.email_domain.trim() || null,
      _website: orgForm.website.trim() || null,
      _hq_city: orgForm.hq_city.trim() || null,
      _hq_state: orgForm.hq_state.trim() || null,
      _description: orgForm.description.trim() || null,
      _phone: orgForm.phone.trim() || null,
      _num_facilities: null,
      _logo_url: orgForm.logo_url || null,
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
    toast.success("Organization created");
  };

  /* ---------- Logo upload ---------- */
  const uploadLogo = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `admin-staged/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("org-logos")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setOrgForm((p) => ({ ...p, logo_url: data.publicUrl }));
    toast.success("Logo uploaded");
  };

  /* ---------- STAGE 2a: PDF flow ---------- */
  const handlePdf = async (file: File) => {
    if (!orgId) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("PDF files only");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("PDF must be under 15MB");
      return;
    }
    setPdfFilename(file.name);
    setPdfBusy(true);
    try {
      const path = `${orgId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("facility-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const pdf_base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("parse-facility-pdf", {
        body: { pdf_base64, filename: file.name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const facilities = ((data as any)?.facilities ?? []) as PdfFacility[];
      if (!facilities.length) throw new Error("No facilities detected in the PDF");
      setParsedFacilities(facilities);
      toast.success(`Extracted ${facilities.length} facility${facilities.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Couldn't read that PDF");
      setPdfFilename("");
    } finally {
      setPdfBusy(false);
    }
  };

  const commitParsedFacilities = async () => {
    if (!orgId || !parsedFacilities || !user) return;
    setCommitting(true);
    const urls: string[] = [];
    try {
      for (const f of parsedFacilities) {
        const { data: inserted, error } = await supabase
          .from("facilities")
          .insert({
            organization_id: orgId,
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
            image_urls: [],
          })
          .select("id, slug")
          .single();
        if (error || !inserted) throw error ?? new Error("Insert failed");

        const contracts = [
          ...(f.payers_in_network ?? []).map((p) => ({
            facility_id: inserted.id, payer_name: p, in_network: true,
          })),
          ...(f.payers_out_of_network ?? []).map((p) => ({
            facility_id: inserted.id, payer_name: p, in_network: false,
          })),
        ];
        if (contracts.length) await supabase.from("insurance_contracts").insert(contracts);
        if (inserted.slug) urls.push(`/p/${inserted.slug}`);
      }
      setCreatedFacilityUrls(urls);
      setStage("done");
      toast.success("Facilities created");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Couldn't save facilities");
    } finally {
      setCommitting(false);
    }
  };

  /* ---------- STAGE 2b: manual flow ---------- */
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
  const removeManual = (idx: number) =>
    setManualFacilities((p) => p.filter((_, i) => i !== idx));

  const saveManual = async () => {
    if (!orgId || !user) return;
    if (manualFacilities.some((f) => !f.name.trim())) {
      toast.error("Every facility needs a name");
      return;
    }
    setSavingManual(true);
    const urls: string[] = [];
    try {
      for (const f of manualFacilities) {
        const { data: inserted, error } = await supabase
          .from("facilities")
          .insert({
            organization_id: orgId,
            submitted_by: user.id,
            name: f.name.trim(),
            tagline: f.tagline.trim() || null,
            address_line1: f.address_line1.trim() || null,
            city: f.city.trim() || null,
            state: f.state.trim() || null,
            zip: f.zip.trim() || null,
            phone: f.phone.trim() || null,
            website: f.website.trim() || null,
            description: f.description.trim() || null,
            capacity: f.capacity ? parseInt(f.capacity, 10) : null,
            levels_of_care: f.levels_of_care,
            highlights: f.highlights,
            population_served: f.population_served,
            specializations: f.specializations,
            accreditations: f.accreditations,
            bd_contact_name: f.bd_contact_name.trim() || null,
            bd_contact_phone: f.bd_contact_phone.trim() || null,
            bd_contact_email: f.bd_contact_email.trim() || null,
            image_urls: f.image_urls,
          })
          .select("id, slug")
          .single();
        if (error || !inserted) throw error ?? new Error("Insert failed");

        const ins = f.payers_in_network.split(",").map((s) => s.trim()).filter(Boolean);
        const oon = f.payers_out_of_network.split(",").map((s) => s.trim()).filter(Boolean);
        const contracts = [
          ...ins.map((p) => ({ facility_id: inserted.id, payer_name: p, in_network: true })),
          ...oon.map((p) => ({ facility_id: inserted.id, payer_name: p, in_network: false })),
        ];
        if (contracts.length) await supabase.from("insurance_contracts").insert(contracts);
        if (inserted.slug) urls.push(`/p/${inserted.slug}`);
      }
      setCreatedFacilityUrls(urls);
      setStage("done");
      toast.success(`${manualFacilities.length} facility${manualFacilities.length === 1 ? "" : "s"} created`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Couldn't save facilities");
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
            Super-admin tool. Create a new organization, then add its facilities by PDF or by hand.
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
                  {orgForm.logo_url ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white border">
                      <img src={orgForm.logo_url} alt="" className="h-full w-full object-contain" />
                      <button type="button"
                        onClick={() => setOrgForm((p) => ({ ...p, logo_url: "" }))}
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

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={creating}>
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
              <p className="text-xs text-muted-foreground">Now add facilities — by PDF (fast) or by hand.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setStage("done"); setCreatedFacilityUrls([]); }}>
              Skip for now
            </Button>
          </div>

          <Tabs defaultValue="pdf">
            <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-2">
              <TabsTrigger value="pdf"><Wand2 className="h-3.5 w-3.5" /> Upload PDF</TabsTrigger>
              <TabsTrigger value="manual"><Plus className="h-3.5 w-3.5" /> Add manually</TabsTrigger>
            </TabsList>

            {/* PDF TAB */}
            <TabsContent value="pdf" className="mt-4 space-y-4">
              {!parsedFacilities && (
                <Card className="border-dashed border-2 p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => pdfRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handlePdf(f); }}>
                  {pdfBusy ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm font-medium">Reading {pdfFilename}…</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="font-semibold">Drop the org's one-pager PDF</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF up to 15MB</p>
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>AI extracts facilities, addresses, levels of care & insurance</span>
                      </div>
                    </>
                  )}
                  <input ref={pdfRef} type="file" accept="application/pdf" hidden
                    onChange={(e) => e.target.files?.[0] && handlePdf(e.target.files[0])} />
                </Card>
              )}

              {parsedFacilities && (
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Extracted {parsedFacilities.length} facility{parsedFacilities.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-muted-foreground">{pdfFilename}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setParsedFacilities(null); setPdfFilename(""); }}>
                      <X className="h-3.5 w-3.5" /> Discard
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {parsedFacilities.map((f, i) => (
                      <div key={i} className="rounded-lg border p-3 text-sm">
                        <p className="font-semibold">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[f.address_line1, f.city, f.state, f.zip].filter(Boolean).join(", ") || "No address"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(f.levels_of_care ?? []).map((l) => <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>)}
                        </div>
                        {(f.payers_in_network?.length ?? 0) > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-2">
                            <span className="font-semibold">In-network:</span> {f.payers_in_network!.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button onClick={commitParsedFacilities} disabled={committing} size="lg" className="w-full sm:w-auto">
                    {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Save all to {orgName}</>}
                  </Button>
                </Card>
              )}
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
              setParsedFacilities(null); setPdfFilename("");
              setManualFacilities([emptyFacility()]); setCreatedFacilityUrls([]);
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
