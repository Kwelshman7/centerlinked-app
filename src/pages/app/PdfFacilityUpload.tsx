import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { assertPdfFile } from "@/lib/upload-guards";
import { programPublicPath } from "@/lib/public-urls";
import { saveFacilityWithContracts } from "@/lib/save-facility";
import { loadApprovedPayers } from "@/lib/load-approved-payers";
import { OrgPdfLibrary } from "@/components/app/OrgPdfLibrary";
import type { PayerMatchInput } from "@/lib/match-payer";
import {
  type ExistingContractRow,
  type ExistingFacilityRow,
  type FacilityImportTarget,
  type ParsedFacility,
  type ParsedPdfPayload,
  contractRowToDraft,
  countNewContracts,
  existingFacilityToDraft,
  facilityCommitKey,
  mergeContractDrafts,
  parsedFacilityContractDrafts,
  parsedFacilityToDraft,
  suggestedImportTargets,
} from "@/lib/pdf-import";
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
  ArrowLeft,
} from "lucide-react";

interface ExtractedImage {
  id: string;
  page: number;
  width: number;
  height: number;
  mime: string;
  data_base64: string;
}

type Stage = "upload" | "parsing" | "review" | "committing" | "done";

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

const EXISTING_FACILITY_SELECT =
  "id,name,tagline,address_line1,city,state,zip,phone,website,description,capacity,levels_of_care,highlights,population_served,specializations,accreditations,image_urls,bd_contact_name,bd_contact_phone,bd_contact_email,hidden_from_org_page";

export default function PdfFacilityUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isFacilityAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryOrgId = (searchParams.get("orgId") || "").trim() || null;
  const fromOnboarding = searchParams.get("from") === "onboarding";
  const targetOrgId = isSuperAdmin
    ? queryOrgId || profile?.organization_id || null
    : profile?.organization_id || null;

  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedPdfPayload | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [mergedCount, setMergedCount] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [imageAssignments, setImageAssignments] = useState<Record<string, number | "none">>({});
  const [committedKeys, setCommittedKeys] = useState<string[]>([]);
  const [importTargets, setImportTargets] = useState<FacilityImportTarget[]>([]);

  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [orgReady, setOrgReady] = useState(false);
  const [orgMissing, setOrgMissing] = useState(false);
  const [existingFacilities, setExistingFacilities] = useState<ExistingFacilityRow[]>([]);
  const [existingContracts, setExistingContracts] = useState<ExistingContractRow[]>([]);
  const [approvedPayers, setApprovedPayers] = useState<PayerMatchInput[]>([]);
  const [pdfLibraryKey, setPdfLibraryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (authLoading) return;
      if (!targetOrgId) {
        setOrgReady(true);
        setOrgMissing(false);
        setOrgName(null);
        setOrgSlug(null);
        setExistingFacilities([]);
        setExistingContracts([]);
        return;
      }
      setOrgReady(false);
      const [{ data: org, error: orgErr }, { data: facs }] = await Promise.all([
        supabase.from("organizations").select("id,name,slug").eq("id", targetOrgId).maybeSingle(),
        supabase.from("facilities").select(EXISTING_FACILITY_SELECT).eq("organization_id", targetOrgId).order("name"),
      ]);
      if (cancelled) return;
      if (orgErr || !org) {
        setOrgMissing(true);
        setOrgName(null);
        setOrgSlug(null);
        setExistingFacilities([]);
        setExistingContracts([]);
        setOrgReady(true);
        return;
      }
      const rows = (facs as ExistingFacilityRow[]) ?? [];
      setOrgMissing(false);
      setOrgName(org.name);
      setOrgSlug(org.slug ?? null);
      setExistingFacilities(rows);
      if (rows.length) {
        const { data: contracts } = await supabase
          .from("insurance_contracts")
          .select("facility_id,payer_id,payer_name,in_network,plan_types")
          .in("facility_id", rows.map((row) => row.id));
        if (!cancelled) setExistingContracts((contracts as ExistingContractRow[]) ?? []);
      } else {
        setExistingContracts([]);
      }
      setOrgReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, targetOrgId]);

  useEffect(() => {
    let cancelled = false;
    loadApprovedPayers()
      .then((payers) => {
        if (!cancelled) setApprovedPayers(payers);
      })
      .catch(() => {
        if (!cancelled) setApprovedPayers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const contractsByFacility = useMemo(() => {
    const map = new Map<string, ExistingContractRow[]>();
    for (const row of existingContracts) {
      const list = map.get(row.facility_id) ?? [];
      list.push(row);
      map.set(row.facility_id, list);
    }
    return map;
  }, [existingContracts]);

  const existingById = useMemo(() => {
    const map = new Map<string, ExistingFacilityRow>();
    for (const row of existingFacilities) map.set(row.id, row);
    return map;
  }, [existingFacilities]);

  if (authLoading || !orgReady) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Sign in to upload</h2>
        <p className="text-sm text-muted-foreground">PDF uploads are for organization admins only.</p>
        <Button asChild><Link to="/login">Sign in</Link></Button>
      </Card>
    );
  }

  if (!isFacilityAdmin) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Admin access required</h2>
        <p className="text-sm text-muted-foreground">
          Only organization admins can import facilities and insurance from a PDF.
        </p>
        <Button asChild variant="outline"><Link to="/app/search">Back to search</Link></Button>
      </Card>
    );
  }

  if (!targetOrgId) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Building2 className="h-8 w-8 mx-auto text-primary" />
        <h2 className="font-heading text-xl font-semibold">
          {isSuperAdmin ? "Choose an organization first" : "Create your organization first"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Open an organization from Admin and use Upload PDF, or create a new organization first."
            : "PDF uploads are linked to your organization. Set yours up, then come back."}
        </p>
        <Button asChild>
          <Link to={isSuperAdmin ? "/app/admin/organizations" : "/setup-organization"}>
            {isSuperAdmin ? "Browse organizations" : "Join or create organization"}
          </Link>
        </Button>
      </Card>
    );
  }

  if (orgMissing) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3">
        <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Organization not found</h2>
        <p className="text-sm text-muted-foreground">That organization id is missing or you cannot access it.</p>
        <Button asChild variant="outline">
          <Link to={isSuperAdmin ? "/app/admin/organizations" : "/app"}>Back</Link>
        </Button>
      </Card>
    );
  }

  const applySuggestedTargets = (facilities: ParsedFacility[]) => {
    setImportTargets(suggestedImportTargets(facilities, existingFacilities));
  };

  const handleFile = async (file: File) => {
    const pdfCheck = await assertPdfFile(file);
    if (!pdfCheck.ok) {
      toast.error(pdfCheck.error);
      return;
    }
    setFileName(file.name);
    setCommittedKeys([]);
    setResultUrls([]);
    setCreatedCount(0);
    setMergedCount(0);
    setImportTargets([]);
    setStage("parsing");
    try {
      const path = `${targetOrgId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("facility-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) {
        const missing = /bucket not found/i.test(upErr.message || "");
        throw new Error(
          missing
            ? "PDF storage is not set up. Run supabase/facility-pdfs-storage.sql in the Supabase SQL editor, then try again."
            : upErr.message,
        );
      }

      let recId: string | null = null;
      const { data: rec, error: recErr } = await supabase
        .from("facility_pdf_uploads")
        .insert({
          organization_id: targetOrgId,
          uploaded_by: user.id,
          filename: file.name,
          storage_path: path,
          size_bytes: file.size,
          status: "parsing",
        })
        .select("id")
        .single();
      if (recErr) {
        console.warn("facility_pdf_uploads insert failed", recErr);
      } else {
        recId = rec.id;
        setUploadId(rec.id);
      }
      setPdfLibraryKey((n) => n + 1);

      const { data, error } = await supabase.functions.invoke("parse-facility-pdf", {
        body: { storage_path: path, filename: file.name, upload_id: recId },
      });
      const parseResult = data as ParsedPdfPayload & { error?: string } | null;
      if (error || parseResult?.error) {
        throw new Error(await edgeFunctionMessage(error, data));
      }
      const parsedData = parseResult as ParsedPdfPayload;
      if (!parsedData.facilities?.length) throw new Error("No facilities detected in the PDF");
      setParsed(parsedData);
      applySuggestedTargets(parsedData.facilities);
      if (recId) {
        await supabase
          .from("facility_pdf_uploads")
          .update({ status: "parsed", parsed_payload: parsedData as unknown as Record<string, unknown> })
          .eq("id", recId);
      }
      setStage("review");

      setExtracting(true);
      supabase.functions
        .invoke("extract-pdf-images", { body: { storage_path: path } })
        .then(({ data: imgData, error: imgErr }) => {
          const imageResult = imgData as { error?: string; images?: ExtractedImage[] } | null;
          if (imgErr || imageResult?.error) {
            console.warn("image extract failed", imgErr ?? imageResult?.error);
            return;
          }
          const imgs = imageResult?.images ?? [];
          setExtractedImages(imgs);
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
    setCreatedCount(0);
    setMergedCount(0);
    setCommittedKeys([]);
    setExtractedImages([]);
    setImageAssignments({});
    setUploadId(null);
    setImportTargets([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleImageAssignment = (imageId: string, value: number | "none") => {
    setImageAssignments((prev) => ({ ...prev, [imageId]: value }));
  };

  const uploadApprovedImages = async (orgId: string): Promise<Record<number, string[]>> => {
    const byFacility: Record<number, string[]> = {};
    for (const img of extractedImages) {
      const assignment = imageAssignments[img.id];
      if (assignment === "none" || assignment === undefined) continue;
      const facilityIdx = assignment as number;
      try {
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

  const updateFacility = (idx: number, patch: Partial<ParsedFacility>) => {
    if (!parsed) return;
    const next = [...parsed.facilities];
    next[idx] = { ...next[idx], ...patch };
    setParsed({ ...parsed, facilities: next });
  };

  const setTarget = (idx: number, value: FacilityImportTarget) => {
    setImportTargets((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const removeFacility = (idx: number) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      facilities: parsed.facilities.filter((_, i) => i !== idx),
    });
    setImportTargets((prev) => prev.filter((_, i) => i !== idx));
    setImageAssignments((prev) => {
      const next: Record<string, number | "none"> = {};
      for (const [id, assignment] of Object.entries(prev)) {
        if (assignment === "none") {
          next[id] = "none";
          continue;
        }
        if (assignment === idx) next[id] = "none";
        else if (typeof assignment === "number" && assignment > idx) next[id] = assignment - 1;
        else next[id] = assignment;
      }
      return next;
    });
  };

  const pendingFacilities = parsed
    ? parsed.facilities.filter((f) => !committedKeys.includes(facilityCommitKey(f)))
    : [];
  const pendingCreates = parsed
    ? parsed.facilities.filter((f, i) => {
        if (committedKeys.includes(facilityCommitKey(f))) return false;
        return !importTargets[i];
      }).length
    : 0;
  const pendingMerges = parsed
    ? parsed.facilities.filter((f, i) => {
        if (committedKeys.includes(facilityCommitKey(f))) return false;
        return !!importTargets[i];
      }).length
    : 0;

  const commit = async () => {
    if (!parsed || !user || !targetOrgId) return;
    setStage("committing");
    try {
      const approvedByFacility = await uploadApprovedImages(targetOrgId);
      const payers = approvedPayers.length ? approvedPayers : await loadApprovedPayers();
      const urls = [...resultUrls];
      const nextCommitted = new Set(committedKeys);
      const failed: { name: string; error: string }[] = [];
      let created = createdCount;
      let merged = mergedCount;

      const liveContracts = new Map<string, ExistingContractRow[]>();
      for (const [id, rows] of contractsByFacility) liveContracts.set(id, [...rows]);

      const mergeBuckets = new Map<
        string,
        { name: string; extracted: ReturnType<typeof parsedFacilityContractDrafts>; imageUrls: string[]; keys: string[] }
      >();

      for (let fIdx = 0; fIdx < parsed.facilities.length; fIdx++) {
        const f = parsed.facilities[fIdx];
        const key = facilityCommitKey(f);
        if (nextCommitted.has(key)) continue;
        const targetId = importTargets[fIdx] ?? null;
        const extracted = parsedFacilityContractDrafts(f, payers);
        const imageUrls = approvedByFacility[fIdx] ?? [];

        if (!targetId) {
          const draft = parsedFacilityToDraft(f, extracted, imageUrls);
          const result = await saveFacilityWithContracts({
            organizationId: targetOrgId,
            draft,
            contractsMode: "all",
          });
          if (!result.ok) {
            failed.push({ name: f.name, error: result.error });
            continue;
          }
          nextCommitted.add(key);
          created += 1;
          if (result.slug) urls.push(programPublicPath(result.slug, orgSlug));
          continue;
        }

        const bucket = mergeBuckets.get(targetId) ?? {
          name: f.name,
          extracted: [],
          imageUrls: [],
          keys: [],
        };
        bucket.extracted = mergeContractDrafts(bucket.extracted, extracted);
        bucket.imageUrls = [...bucket.imageUrls, ...imageUrls];
        bucket.keys.push(key);
        mergeBuckets.set(targetId, bucket);
      }

      for (const [facilityId, bucket] of mergeBuckets) {
        const existing = existingById.get(facilityId);
        if (!existing) {
          failed.push({ name: bucket.name, error: "Matched facility is no longer available" });
          continue;
        }
        const current = (liveContracts.get(facilityId) ?? []).map(contractRowToDraft);
        const contracts = mergeContractDrafts(current, bucket.extracted);
        const draft = existingFacilityToDraft(existing, contracts, bucket.imageUrls);
        const result = await saveFacilityWithContracts({
          organizationId: targetOrgId,
          facilityId,
          draft,
          contractsMode: "all",
        });
        if (!result.ok) {
          failed.push({ name: existing.name, error: result.error });
          continue;
        }
        for (const key of bucket.keys) nextCommitted.add(key);
        merged += 1;
        liveContracts.set(
          facilityId,
          contracts.map((c) => ({
            facility_id: facilityId,
            payer_id: c.payer_id,
            payer_name: c.payer_name,
            in_network: c.in_network,
            plan_types: c.plan_types,
          })),
        );
        if (result.slug) urls.push(programPublicPath(result.slug, orgSlug));
      }

      setCommittedKeys([...nextCommitted]);
      setResultUrls(urls);
      setCreatedCount(created);
      setMergedCount(merged);

      if (failed.length) {
        toast.error(
          `${urls.length} saved, ${failed.length} failed`,
          { description: failed.map((x) => `${x.name}: ${x.error}`).join(" · ") },
        );
        setStage("review");
        return;
      }

      if (uploadId) {
        await supabase
          .from("facility_pdf_uploads")
          .update({ status: "committed", facilities_created: created })
          .eq("id", uploadId);
      }
      setStage("done");
      const parts = [
        created ? `${created} facilit${created === 1 ? "y" : "ies"} created` : null,
        merged ? `insurance added to ${merged} existing` : null,
      ].filter(Boolean);
      toast.success(parts.join(" · ") || "Nothing to save");
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Please try again.";
      toast.error("Couldn't save", { description: message });
      setStage("review");
    }
  };

  const afterSaveHref = fromOnboarding
    ? "/app/search"
    : isSuperAdmin && queryOrgId
      ? `/app/admin/organizations/${queryOrgId}?tab=facilities`
      : "/app/facilities";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {fromOnboarding ? (
        <Link to="/app/onboarding" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to onboarding
        </Link>
      ) : null}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-7 w-7 text-primary" />
          Import facilities from a PDF
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Saving to <span className="font-medium text-foreground">{orgName}</span>.
          New locations are created; matches only add missing insurance.
        </p>
      </div>

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
                {s === "upload" ? "Upload PDF" : s === "review" ? "Confirm details" : "Done"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          );
        })}
      </div>

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
            <span>Reads facilities and insurance directly — never makes anything up</span>
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

      {stage === "upload" && targetOrgId && (
        <Card className="p-5">
          <OrgPdfLibrary organizationId={targetOrgId} refreshToken={pdfLibraryKey} />
        </Card>
      )}

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
                  {parsed.facilities.length === 1 ? "y" : "ies"} detected · saving to {orgName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4" /> Start over
            </Button>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-heading text-lg font-semibold">Organization</h2>
              <Badge variant="secondary" className="text-xs">Existing — not overwritten</Badge>
            </div>
            <p className="font-medium">{orgName}</p>
            {parsed.organization.name && parsed.organization.name !== orgName && (
              <p className="text-xs text-muted-foreground">
                PDF listed “{parsed.organization.name}”. We will not change the org profile from this upload.
              </p>
            )}
          </Card>

          {parsed.facilities.map((f, idx) => {
            const alreadySaved = committedKeys.includes(facilityCommitKey(f));
            const targetId = importTargets[idx] ?? null;
            const matched = targetId ? existingById.get(targetId) : null;
            const extractedDrafts = parsedFacilityContractDrafts(f, approvedPayers);
            const existingDrafts = targetId
              ? (contractsByFacility.get(targetId) ?? []).map(contractRowToDraft)
              : [];
            const delta = targetId
              ? countNewContracts(existingDrafts, extractedDrafts)
              : { newCount: extractedDrafts.length, alreadyCount: 0 };
            const duplicateTarget = !!targetId && importTargets.filter((id) => id === targetId).length > 1;

            return (
            <Card key={idx} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading text-lg font-semibold">
                    {f.name || `Facility ${idx + 1}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Facility {idx + 1} of {parsed.facilities.length}
                    {alreadySaved ? " · already saved" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {alreadySaved ? (
                    <Badge variant="secondary">Saved</Badge>
                  ) : matched ? (
                    <Badge variant="secondary">Add insurance to existing</Badge>
                  ) : (
                    <Badge>Create new</Badge>
                  )}
                  {!alreadySaved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFacility(idx)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Save as</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={alreadySaved}
                  value={targetId ?? ""}
                  onChange={(e) => setTarget(idx, e.target.value || null)}
                >
                  <option value="">Create new facility</option>
                  {existingFacilities.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {row.city ? ` (${row.city}${row.state ? `, ${row.state}` : ""})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {matched
                    ? `${delta.newCount} new payer${delta.newCount === 1 ? "" : "s"}, ${delta.alreadyCount} already listed. Existing profile fields stay as they are.`
                    : `${delta.newCount} insurance contract${delta.newCount === 1 ? "" : "s"} will be created with this facility.`}
                </p>
                {duplicateTarget && (
                  <p className="text-xs text-amber-700">
                    Another extracted facility is also targeting this location. Insurance from both will be merged in one save.
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={f.name}
                    disabled={alreadySaved || !!matched}
                    onChange={(e) => updateFacility(idx, { name: e.target.value })}
                  />
                </div>
                {!matched && (
                  <>
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
                        disabled={alreadySaved}
                        onChange={(e) => updateFacility(idx, { address_line1: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={f.city ?? ""}
                        disabled={alreadySaved}
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
                  </>
                )}
                <div className="sm:col-span-2">
                  <Label>In-Network Payers</Label>
                  <Textarea
                    rows={2}
                    disabled={alreadySaved}
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
                {!matched && (
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
                )}
              </div>
            </Card>
            );
          })}

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
                      : "New facilities get assigned photos. Existing facilities only append photos you assign here."}
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
                            {parsed.facilities.map((fac, i) => (
                              <option key={i} value={i}>
                                {fac.name || `Facility ${i + 1}`}
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

          <div className="sticky bottom-4 z-10">
            <Card className="p-4 flex items-center justify-between gap-3 flex-wrap shadow-lg border-primary/20">
              <p className="text-sm">
                {pendingCreates > 0 && pendingMerges > 0
                  ? `Create ${pendingCreates} new and add insurance to ${pendingMerges} existing.`
                  : pendingMerges > 0
                  ? `Add insurance to ${pendingMerges} existing facilit${pendingMerges === 1 ? "y" : "ies"}.`
                  : pendingCreates > 0
                  ? `Create ${pendingCreates} new facilit${pendingCreates === 1 ? "y" : "ies"}.`
                  : "Nothing left to save."}
                {committedKeys.length > 0 ? ` (${committedKeys.length} already saved).` : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={commit}
                  disabled={!pendingFacilities.length || stage !== "review" || extracting}
                >
                  {extracting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Finding photos…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Confirm & save</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {stage === "committing" && (
        <Card className="p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="font-semibold">Saving facilities and insurance…</p>
        </Card>
      )}

      {stage === "done" && (
        <Card className="p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/15 grid place-items-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">Import complete</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {[
                createdCount ? `${createdCount} new page${createdCount === 1 ? "" : "s"}` : null,
                mergedCount ? `insurance updated on ${mergedCount}` : null,
              ].filter(Boolean).join(" · ") || "No changes were needed."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate(afterSaveHref)}>
              {fromOnboarding ? "Search the network" : "View facilities"} <ArrowRight className="h-4 w-4" />
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
