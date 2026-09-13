import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { assertPdfFile } from "@/lib/upload-guards";
import { isPersonalEmail, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { reviewImportGaps, type ParsedFacility } from "@/lib/pdf-import";
import { applySocialMeta } from "@/lib/social-meta";
import { CheckCircle2, FileText, Loader2, Lock, Upload } from "lucide-react";

type Stage = "checking" | "invalid" | "upload" | "parsing" | "review" | "committing" | "done";

type ParsedOrg = {
  name: string;
  website?: string | null;
  description?: string | null;
  phone?: string | null;
  hq_city?: string | null;
  hq_state?: string | null;
};

type CommitResult = {
  organization_name: string;
  facilities_created: number;
  claim_email: string;
  email_sent: boolean;
  email_error?: string;
};

async function postLaunch(body: Record<string, unknown>) {
  const res = await fetch("/api/launch-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : `Request failed (${res.status})`);
  }
  return json;
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

function emptyFacility(): ParsedFacility {
  return { name: "" };
}

export default function LaunchImport() {
  const { token } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("checking");
  const [fileName, setFileName] = useState("");
  const [org, setOrg] = useState<ParsedOrg>({ name: "" });
  const [facilities, setFacilities] = useState<ParsedFacility[]>([]);
  const [bdName, setBdName] = useState("");
  const [bdPhone, setBdPhone] = useState("");
  const [bdEmail, setBdEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);

  useEffect(() => {
    applySocialMeta({
      title: "Launch import · CenterLinked",
      description: "Private helper link to add an organization from a PDF. Confirm every field before save.",
      path: "/launch",
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    postLaunch({ action: "check", token })
      .then(() => setStage("upload"))
      .catch(() => setStage("invalid"));
  }, [token]);

  const gaps = useMemo(
    () =>
      facilities.flatMap((facility) =>
        reviewImportGaps({
          parsed: {
            ...facility,
            bd_contact_name: bdName,
            bd_contact_phone: bdPhone,
            bd_contact_email: bdEmail,
          },
          extractedContracts: [
            ...(facility.payers_in_network ?? []).map((name) => ({
              payer_id: null,
              payer_name: name,
              in_network: true,
              plan_types: [],
            })),
            ...(facility.payers_out_of_network ?? []).map((name) => ({
              payer_id: null,
              payer_name: name,
              in_network: false,
              plan_types: [],
            })),
          ],
          assignedPhotoCount: 0,
        }),
      ),
    [facilities, bdName, bdPhone, bdEmail],
  );

  const uniqueGaps = [...new Set(gaps)];

  const updateFacility = (idx: number, patch: Partial<ParsedFacility>) => {
    setFacilities((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleFile = async (file: File) => {
    const check = await assertPdfFile(file);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    setFileName(file.name);
    setStage("parsing");
    try {
      const pdf_base64 = await fileToBase64(file);
      const parsed = await postLaunch({
        action: "parse",
        token,
        filename: file.name,
        pdf_base64,
      });
      const nextOrg = (parsed.organization || {}) as ParsedOrg;
      const nextFacilities = Array.isArray(parsed.facilities)
        ? (parsed.facilities as ParsedFacility[])
        : [];
      if (!nextFacilities.length) throw new Error("No facilities detected in the PDF");
      setOrg({
        name: nextOrg.name || "",
        website: nextOrg.website ?? "",
        description: nextOrg.description ?? "",
        phone: nextOrg.phone ?? "",
        hq_city: nextOrg.hq_city ?? "",
        hq_state: nextOrg.hq_state ?? "",
      });
      setFacilities(nextFacilities);
      const firstBd = nextFacilities.find((row) => row.bd_contact_name);
      setBdName(firstBd?.bd_contact_name || "");
      setBdPhone(firstBd?.bd_contact_phone || "");
      setBdEmail(firstBd?.bd_contact_email || "");
      setConfirmed(false);
      setStage("review");
    } catch (err) {
      toast.error("Couldn't read that PDF", {
        description: err instanceof Error ? err.message : "Try a clearer one-pager.",
      });
      setStage("upload");
    }
  };

  const commit = async () => {
    if (!org.name.trim()) {
      toast.error("Confirm the organization name");
      return;
    }
    if (!bdName.trim() || !(bdPhone.trim() || bdEmail.trim())) {
      toast.error("Add a BD contact name plus a phone or email");
      return;
    }
    if (!ownerName.trim() || !ownerEmail.trim()) {
      toast.error("Add the owner's name and work email");
      return;
    }
    if (isPersonalEmail(ownerEmail)) {
      toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
        description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
      });
      return;
    }
    if (!confirmed) {
      toast.error("Check the confirmation box before saving");
      return;
    }
    setStage("committing");
    try {
      const json = await postLaunch({
        action: "commit",
        token,
        confirmed: true,
        organization: org,
        facilities,
        bd: { name: bdName, phone: bdPhone, email: bdEmail },
        owner: { name: ownerName, email: ownerEmail },
      });
      setResult({
        organization_name: String(json.organization_name || org.name),
        facilities_created: Number(json.facilities_created || facilities.length),
        claim_email: String(json.claim_email || ownerEmail),
        email_sent: json.email_sent !== false,
        email_error: typeof json.email_error === "string" ? json.email_error : undefined,
      });
      setStage("done");
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setStage("review");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <p className="text-xs text-muted-foreground">Private launch import</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {stage === "checking" && (
          <Card className="p-10 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            Checking this launch link…
          </Card>
        )}

        {stage === "invalid" && (
          <Card className="p-10 text-center space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <h1 className="font-heading text-2xl font-bold">This link is not valid</h1>
            <p className="text-sm text-muted-foreground">
              Ask Kyle for the current launch import URL. Do not guess missing fields or create a listing from memory.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to CenterLinked</Link>
            </Button>
          </Card>
        )}

        {stage === "upload" && (
          <Card
            className="border-dashed border-2 p-10 text-center hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center mb-4">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Add an organization from a PDF</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Nothing is saved until you confirm the org name, locations, insurance, and BD contact.
              Missing values stay unknown — do not guess.
            </p>
            <p className="text-xs text-muted-foreground mt-3">PDF up to 15MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </Card>
        )}

        {stage === "parsing" && (
          <Card className="p-10 text-center space-y-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <p className="font-semibold">Reading {fileName}…</p>
            <p className="text-sm text-muted-foreground">Usually 10–30 seconds. Nothing has been saved yet.</p>
          </Card>
        )}

        {stage === "review" && (
          <div className="space-y-5">
            <div>
              <h1 className="font-heading text-2xl font-bold">Confirm before save</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Check every field against the PDF. Leave blanks empty rather than inventing an address, payer, or contact.
              </p>
            </div>

            <Card className="p-5 space-y-3">
              <h2 className="font-heading text-lg font-semibold">Organization</h2>
              <div>
                <Label>Organization name</Label>
                <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Website</Label>
                  <Input value={org.website ?? ""} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={org.phone ?? ""} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
                </div>
                <div>
                  <Label>HQ city</Label>
                  <Input value={org.hq_city ?? ""} onChange={(e) => setOrg({ ...org, hq_city: e.target.value })} />
                </div>
                <div>
                  <Label>HQ state</Label>
                  <Input value={org.hq_state ?? ""} onChange={(e) => setOrg({ ...org, hq_state: e.target.value })} />
                </div>
              </div>
            </Card>

            {facilities.map((facility, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading text-lg font-semibold">
                    {facility.name || `Facility ${idx + 1}`}
                  </h2>
                  {facilities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setFacilities((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={facility.name} onChange={(e) => updateFacility(idx, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Street</Label>
                  <Input
                    value={facility.address_line1 ?? ""}
                    onChange={(e) => updateFacility(idx, { address_line1: e.target.value })}
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={facility.city ?? ""} onChange={(e) => updateFacility(idx, { city: e.target.value })} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={facility.state ?? ""} onChange={(e) => updateFacility(idx, { state: e.target.value })} />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={facility.zip ?? ""} onChange={(e) => updateFacility(idx, { zip: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>In-network payers (only if the PDF shows them as accepted)</Label>
                  <Textarea
                    rows={2}
                    value={(facility.payers_in_network ?? []).join(", ")}
                    onChange={(e) =>
                      updateFacility(idx, {
                        payers_in_network: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Out-of-network (only if the PDF says so)</Label>
                  <Textarea
                    rows={2}
                    value={(facility.payers_out_of_network ?? []).join(", ")}
                    onChange={(e) =>
                      updateFacility(idx, {
                        payers_out_of_network: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={() => setFacilities((prev) => [...prev, emptyFacility()])}>
              Add another facility
            </Button>

            <Card className="p-5 space-y-3">
              <h2 className="font-heading text-lg font-semibold">BD contact</h2>
              <p className="text-xs text-muted-foreground">
                Required: a name plus a direct phone or email. This is who referral partners should call.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={bdName} onChange={(e) => setBdName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={bdPhone} onChange={(e) => setBdPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={bdEmail} onChange={(e) => setBdEmail(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="font-heading text-lg font-semibold">Who should claim this org</h2>
              <p className="text-xs text-muted-foreground">
                They get a free signup email and become the organization admin. Use their work email.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Owner name</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </div>
                <div>
                  <Label>Work email</Label>
                  <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                </div>
              </div>
            </Card>

            {uniqueGaps.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <p className="font-medium">Will stay unknown after save</p>
                <p className="mt-1">{uniqueGaps.join(" · ")}</p>
                <p className="mt-1 text-amber-800/80">Fill only values that are on the PDF or that you have confirmed.</p>
              </div>
            )}

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                I confirmed the organization name and every location, insurance name, and contact against the PDF or
                the organization. I did not guess missing fields.
              </span>
            </label>

            <Button onClick={() => void commit()} disabled={!confirmed}>
              <FileText className="h-4 w-4" /> Save organization and email the owner
            </Button>
          </div>
        )}

        {stage === "committing" && (
          <Card className="p-10 text-center space-y-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <p className="font-semibold">Saving the organization…</p>
          </Card>
        )}

        {stage === "done" && result && (
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-success/15 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h1 className="font-heading text-2xl font-bold">{result.organization_name} is in CenterLinked</h1>
            <p className="text-sm text-muted-foreground">
              {result.facilities_created} facilit{result.facilities_created === 1 ? "y" : "ies"} saved.
              {result.email_sent
                ? ` A free claim email was sent to ${result.claim_email}.`
                : ` Saved, but the claim email failed${result.email_error ? `: ${result.email_error}` : "."}`}
            </p>
            <Button
              onClick={() => {
                setStage("upload");
                setFacilities([]);
                setOrg({ name: "" });
                setResult(null);
                setConfirmed(false);
              }}
            >
              Add another organization
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
