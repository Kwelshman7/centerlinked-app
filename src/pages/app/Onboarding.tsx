import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/app/ImageUploader";
import { FacilityCardForm } from "@/components/app/facility/FacilityCardForm";
import { FacilityDraft, emptyFacility } from "@/components/app/facility/facility-types";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Rocket,
  ListChecks,
  BadgeCheck,
  MapPin,
  Phone as PhoneIcon,
} from "lucide-react";
import { toast } from "sonner";

interface OrgDraft {
  name: string;
  website: string;
  hq_city: string;
  hq_state: string;
  description: string;
  phone: string;
  num_facilities: string;
  logo_url: string;
}

const STEPS = [
  { id: 1, title: "Your organization", icon: Building2 },
  { id: 2, title: "Your facilities", icon: ListChecks },
  { id: 3, title: "Review & launch", icon: Rocket },
];

export default function Onboarding() {
  const { profile, user, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addOnly = params.get("add") === "1";

  const [step, setStep] = useState(addOnly ? 2 : 1);
  const [saving, setSaving] = useState(false);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [org, setOrg] = useState<OrgDraft>({
    name: "", website: "", hq_city: "", hq_state: "", description: "", phone: "", num_facilities: "", logo_url: "",
  });
  const [facilities, setFacilities] = useState<FacilityDraft[]>([emptyFacility()]);

  // Hydrate org from DB if linked
  useEffect(() => {
    if (!profile?.organization_id) {
      setOrgLoaded(true);
      return;
    }
    supabase.from("organizations").select("*").eq("id", profile.organization_id).maybeSingle().then(({ data }) => {
      if (data) {
        setOrg({
          name: data.name ?? "",
          website: data.website ?? "",
          hq_city: data.hq_city ?? "",
          hq_state: data.hq_state ?? "",
          description: data.description ?? "",
          phone: (data as { phone?: string | null }).phone ?? "",
          num_facilities: (data as { num_facilities?: number | null }).num_facilities?.toString() ?? "",
          logo_url: data.logo_url ?? "",
        });
      }
      setOrgLoaded(true);
    });
  }, [profile?.organization_id]);

  const updateOrg = <K extends keyof OrgDraft>(k: K, v: OrgDraft[K]) =>
    setOrg((p) => ({ ...p, [k]: v }));

  const updateFacility = (i: number, next: FacilityDraft) =>
    setFacilities((p) => p.map((f, idx) => (idx === i ? next : f)));
  const addFacility = () => setFacilities((p) => [...p, emptyFacility()]);
  const removeFacility = (i: number) =>
    setFacilities((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const canContinueOrg = org.name.trim().length > 0;
  const canContinueFacilities = facilities.every((f) => f.name.trim().length > 0);

  const totalContracts = useMemo(
    () => facilities.reduce((sum, f) => sum + f.contracts.filter((c) => c.payer_name.trim()).length, 0),
    [facilities],
  );

  const handleSubmit = async () => {
    if (!user) return;
    if (!profile?.organization_id) {
      toast.error("Your account isn't linked to an organization yet.");
      navigate("/setup-organization", { replace: true });
      return;
    }
    setSaving(true);

    try {
      // 1. Update organization
      const { error: orgErr } = await supabase
        .from("organizations")
        .update({
          name: org.name.trim(),
          website: org.website || null,
          hq_city: org.hq_city || null,
          hq_state: org.hq_state || null,
          description: org.description || null,
          phone: org.phone || null,
          num_facilities: org.num_facilities ? parseInt(org.num_facilities) : null,
          logo_url: org.logo_url || null,
        })
        .eq("id", profile.organization_id);
      if (orgErr) throw orgErr;

      // 2. Insert facilities in one batch, then contracts
      const validFacilities = facilities.filter((f) => f.name.trim());
      if (validFacilities.length) {
        const { data: insertedFacs, error: facErr } = await supabase
          .from("facilities")
          .insert(
            validFacilities.map((f) => ({
              organization_id: profile.organization_id,
              submitted_by: user.id,
              name: f.name.trim(),
              tagline: f.tagline || null,
              address_line1: f.address_line1 || null,
              city: f.city || null,
              state: f.state || null,
              zip: f.zip || null,
              phone: f.phone || null,
              website: f.website || null,
              description: f.description || null,
              capacity: f.capacity ? parseInt(f.capacity) : null,
              levels_of_care: f.levels_of_care,
              highlights: f.highlights,
              population_served: f.population_served,
              specializations: f.specializations,
              image_urls: f.image_urls,
              bd_contact_name: f.bd_contact_name || null,
              bd_contact_phone: f.bd_contact_phone || null,
              bd_contact_email: f.bd_contact_email || null,
              verification_status: "pending",
            })),
          )
          .select("id");
        if (facErr) throw facErr;

        const allContracts = (insertedFacs ?? []).flatMap((row, idx) =>
          (validFacilities[idx].contracts ?? [])
            .filter((c) => c.payer_name.trim())
            .map((c) => ({
              facility_id: row.id,
              payer_id: c.payer_id || null,
              payer_name: c.payer_name.trim(),
              in_network: c.in_network,
            })),
        );
        if (allContracts.length) {
          const { error: cErr } = await supabase.from("insurance_contracts").insert(allContracts);
          if (cErr) throw cErr;
        }
      }

      await refresh();
      toast.success("Network submitted!", { description: "Your facilities are pending verification." });
      navigate("/app");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!orgLoaded) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="relative max-w-4xl mx-auto pb-32 sm:pb-12">
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header — minimal in add-only mode, hero in full onboarding */}
      {addOnly ? (
        <div className="mb-6 animate-fade-up">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Add a facility</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details below. Each facility gets its own profile page.</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-10 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Let's get your network on the map
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Set up your treatment network</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Add every program your team manages, the insurance you accept, and the BD rep referrals should reach. Takes about 5 minutes.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => {
                const active = step === s.id;
                const done = step > s.id;
                const Icon = done ? Check : s.icon;
                return (
                  <div key={s.id} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full grid place-items-center font-semibold transition-all shadow-sm ${
                          done
                            ? "bg-success text-success-foreground"
                            : active
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 -mt-6 sm:mt-0 transition-colors ${step > s.id ? "bg-success" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* STEP 1: Organization */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-up">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-accent/20 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">Tell us about your organization</h2>
                <p className="text-sm text-muted-foreground">This shows up on your network profile.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization name *</Label>
                <Input value={org.name} onChange={(e) => updateOrg("name", e.target.value)} placeholder="Flyland Recovery Network" />
              </div>
              <div className="space-y-2">
                <Label>Main phone</Label>
                <Input value={org.phone} onChange={(e) => updateOrg("phone", e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input type="url" placeholder="https://" value={org.website} onChange={(e) => updateOrg("website", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>HQ city</Label>
                <Input value={org.hq_city} onChange={(e) => updateOrg("hq_city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>HQ state</Label>
                <Input value={org.hq_state} onChange={(e) => updateOrg("hq_state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label># of facilities</Label>
                <Input type="number" min="1" value={org.num_facilities} onChange={(e) => updateOrg("num_facilities", e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>About</Label>
                <Textarea rows={4} value={org.description} onChange={(e) => updateOrg("description", e.target.value)} placeholder="One paragraph about your network — your mission, your reach, what makes you different." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Logo</Label>
                <ImageUploader
                  bucket="org-logos"
                  value={org.logo_url ? [org.logo_url] : []}
                  onChange={(v) => updateOrg("logo_url", v[v.length - 1] ?? "")}
                  max={1}
                  label="Upload logo"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Facilities */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-up">
          {!addOnly && (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-accent/30 to-card p-5 sm:p-6 border border-border/60">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md shrink-0">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">Add every program in your network</h2>
                  <p className="text-sm text-muted-foreground">
                    Different name, location, photos, insurance contracts, BD rep — each one gets its own profile page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {facilities.map((f, i) => (
            <FacilityCardForm
              key={i}
              index={i}
              value={f}
              onChange={(next) => updateFacility(i, next)}
              onRemove={facilities.length > 1 ? () => removeFacility(i) : undefined}
            />
          ))}

          <button
            type="button"
            onClick={addFacility}
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/40 transition-all py-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary group"
          >
            <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" /> Add another facility
          </button>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-up">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-accent/20 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">Review and launch</h2>
                <p className="text-sm text-muted-foreground">Double-check everything below, then submit for verification.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <ReviewStat label="Facilities" value={facilities.filter((f) => f.name.trim()).length} />
              <ReviewStat label="Insurance contracts" value={totalContracts} />
              <ReviewStat label="Total photos" value={facilities.reduce((s, f) => s + f.image_urls.length, 0)} />
            </div>

            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-lg">{org.name || "Your organization"}</h3>
              {(org.hq_city || org.hq_state) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[org.hq_city, org.hq_state].filter(Boolean).join(", ")}</p>
              )}
              {org.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> {org.phone}</p>}
              {org.description && <p className="text-sm">{org.description}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {facilities.filter((f) => f.name.trim()).map((f, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-4 flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {f.image_urls[0] ? <img src={f.image_urls[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-muted-foreground"><Building2 className="h-6 w-6" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{f.name}</p>
                  {f.tagline && <p className="text-xs text-muted-foreground truncate">{f.tagline}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.levels_of_care.slice(0, 4).map((l) => <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{l}</span>)}
                    {f.contracts.filter((c) => c.payer_name.trim()).length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success/10 text-success font-medium">{f.contracts.filter((c) => c.payer_name.trim()).length} contracts</span>
                    )}
                    {f.bd_contact_name && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground font-medium">BD: {f.bd_contact_name}</span>
                    )}
                  </div>
                </div>
                <BadgeCheck className="h-5 w-5 text-success shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky footer nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:static sm:mt-8 z-30">
        <div className="bg-card/95 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none border-t border-border sm:border-0 px-4 py-3 sm:p-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || saving}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                size="lg"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={(step === 1 && !canContinueOrg) || (step === 2 && !canContinueFacilities)}
                className="shadow-md"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={handleSubmit} disabled={saving} className="shadow-md">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Rocket className="h-4 w-4" /> Submit for verification</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
      <p className="font-heading text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
