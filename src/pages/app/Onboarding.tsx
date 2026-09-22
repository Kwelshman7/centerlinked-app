import { useEffect, useMemo, useRef, useState } from "react";
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
import { saveFacilityWithContracts } from "@/lib/save-facility";
import { bdFieldsFromUser, hasAssignedBdContact } from "@/lib/bd-contact";
import { fullNameFromAuthUser } from "@/lib/auth-user";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileText,
  Loader2,
  Plus,
  Search as SearchIcon,
  Sparkles,
  Rocket,
  ListChecks,
  BadgeCheck,
  MapPin,
  Phone as PhoneIcon,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { orgOnboardingSelect } from "@/lib/org-public-select";

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
  const { profile, user, refresh, loading, isFacilityAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addOnly = params.get("add") === "1";
  const canImportPdf = isFacilityAdmin || isSuperAdmin;

  const [step, setStep] = useState(addOnly ? 2 : 1);
  const [addingHow, setAddingHow] = useState<"undecided" | "manual">(addOnly ? "manual" : "undecided");
  const [saving, setSaving] = useState(false);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [org, setOrg] = useState<OrgDraft>({
    name: "", website: "", hq_city: "", hq_state: "", description: "", phone: "", num_facilities: "", logo_url: "",
  });
  const [facilities, setFacilities] = useState<FacilityDraft[]>([emptyFacility()]);
  const [orgLinkChecked, setOrgLinkChecked] = useState(false);
  const [orgLinkFailed, setOrgLinkFailed] = useState(false);
  const prefilledBd = useRef(false);
  const submittingRef = useRef(false);
  const draftFromMe = (): FacilityDraft => ({
    ...emptyFacility(),
    ...bdFieldsFromUser({
      full_name: profile?.full_name || fullNameFromAuthUser(user),
      email: profile?.email || user?.email,
    }),
  });

  useEffect(() => {
    if (loading) return;
    if (profile?.organization_id) {
      setOrgLinkChecked(true);
      setOrgLinkFailed(false);
      return;
    }
    let cancelled = false;
    void refresh().finally(() => {
      if (!cancelled) setOrgLinkChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, profile?.organization_id, refresh]);

  useEffect(() => {
    if (loading || !orgLinkChecked) return;
    if (profile?.organization_id) return;
    let cancelled = false;
    void (async () => {
      // Create/claim can land here before profiles.organization_id flushes.
      // A membership row means they already have an org — don't bounce to setup.
      if (user?.id) {
        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (membershipError) {
          toast.error("Couldn't confirm your organization", {
            description: "Stay here — retry, or go to Search and add facilities when your organization appears.",
          });
          await refresh();
          if (!cancelled) setOrgLinkFailed(true);
          return;
        }
        if (membership?.organization_id) {
          await refresh();
          return;
        }
      }
      if (cancelled) return;
      navigate("/setup-organization", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, orgLinkChecked, profile?.organization_id, user?.id, refresh, navigate]);

  // Hydrate org from DB if linked
  useEffect(() => {
    if (!profile?.organization_id) {
      setOrgLoaded(true);
      return;
    }
    supabase.from("organizations").select(orgOnboardingSelect).eq("id", profile.organization_id).maybeSingle().then(({ data, error }) => {
      if (error) {
        toast.error("Couldn't load organization details", { description: error.message });
        if (!addOnly) setStep((s) => (s === 1 ? 2 : s));
      } else if (data) {
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
        if (!addOnly && (data.name ?? "").trim()) {
          setStep((s) => (s === 1 ? 2 : s));
        }
      }
      setOrgLoaded(true);
    });
  }, [profile?.organization_id, addOnly]);

  useEffect(() => {
    const fields = bdFieldsFromUser({
      full_name: profile?.full_name || fullNameFromAuthUser(user),
      email: profile?.email || user?.email,
    });
    if (!fields.bd_contact_name && !fields.bd_contact_email) return;
    setFacilities((prev) =>
      prev.map((f, i) => {
        if (i !== 0) return f;
        if (prefilledBd.current) {
          return !f.bd_contact_name.trim() && fields.bd_contact_name
            ? { ...f, bd_contact_name: fields.bd_contact_name }
            : f;
        }
        if (f.bd_contact_name.trim() || f.bd_contact_email.trim() || f.bd_contact_phone.trim()) {
          return f;
        }
        return { ...f, ...fields };
      }),
    );
    prefilledBd.current = true;
  }, [profile?.full_name, profile?.email, user]);

  const updateOrg = <K extends keyof OrgDraft>(k: K, v: OrgDraft[K]) =>
    setOrg((p) => ({ ...p, [k]: v }));

  const updateFacility = (i: number, next: FacilityDraft) =>
    setFacilities((p) => p.map((f, idx) => (idx === i ? next : f)));
  const addFacility = () => setFacilities((p) => [...p, draftFromMe()]);
  const removeFacility = (i: number) =>
    setFacilities((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const canContinueOrg = org.name.trim().length > 0;
  const canContinueFacilities = facilities.some((f) => f.name.trim().length > 0);

  const totalContracts = useMemo(
    () => facilities.reduce((sum, f) => sum + f.contracts.filter((c) => c.payer_name.trim()).length, 0),
    [facilities],
  );
  const missingReferralContact = facilities.some(
    (f) => f.name.trim() && !hasAssignedBdContact(f),
  );

  const handleSubmit = async () => {
    if (!user) return;
    if (!profile?.organization_id) {
      toast.error("Your account isn't linked to an organization yet.");
      navigate("/setup-organization", { replace: true });
      return;
    }
    if (submittingRef.current) {
      toast.message("Still submitting", {
        description: "Check Facilities before adding the same programs again.",
      });
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    let timedOut = false;
    const fallbackTimer = window.setTimeout(() => {
      timedOut = true;
      setSaving(false);
      toast.error("Taking too long to submit facilities", {
        description: "You can leave this page. Check Facilities before adding the same programs again.",
      });
    }, 20_000);

    try {
      // Org updates are admin-only. Invited BD reps still save facilities here.
      if (!addOnly && (isFacilityAdmin || isSuperAdmin) && org.name.trim()) {
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
        if (orgErr) {
          toast.error("Couldn't update organization details", {
            description: "Your facilities and insurance will still save.",
          });
        }
      }

      const validFacilities = facilities.filter((f) => f.name.trim());
      if (!validFacilities.length) {
        toast.error("Add at least one facility name");
        return;
      }
      const savedNames: string[] = [];
      const failed: { name: string; error: string }[] = [];
      const stillFailed: FacilityDraft[] = [];
      let firstSavedId: string | null = null;
      for (const facilityDraft of validFacilities) {
        const result = await saveFacilityWithContracts({
          organizationId: profile.organization_id,
          draft: facilityDraft,
          includeHidden: isFacilityAdmin || isSuperAdmin,
          contractsMode: "all",
        });
        if (result.ok) {
          savedNames.push(facilityDraft.name.trim());
          if (!firstSavedId) firstSavedId = result.facilityId;
        } else {
          failed.push({ name: facilityDraft.name.trim(), error: result.error });
          stillFailed.push(facilityDraft);
        }
      }

      if (failed.length) {
        setFacilities(stillFailed.length ? stillFailed : [draftFromMe()]);
        toast.error(
          `${savedNames.length} saved, ${failed.length} failed`,
          { description: failed.map((f) => `${f.name}: ${f.error}`).join(" · ") },
        );
        return;
      }

      await refresh();
      toast.success("Facilities submitted", {
        description: "They're pending review. You can add or edit insurance anytime.",
      });
      navigate(firstSavedId ? `/app/facilities/${firstSavedId}` : "/app/search");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      window.clearTimeout(fallbackTimer);
      submittingRef.current = false;
      if (!timedOut) setSaving(false);
    }
  };

  const showHowChooser = step === 2 && addingHow === "undecided" && !addOnly && canImportPdf;
  const showManualFacilities = step === 2 && !showHowChooser;

  if (orgLinkFailed && !profile?.organization_id) {
    return (
      <div className="grid place-items-center py-24 px-4 text-center space-y-3">
        <p className="font-medium">Couldn't confirm your organization</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your account may still be linking. Retry, or search now and add facilities when it appears.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setOrgLinkFailed(false);
              setOrgLinkChecked(false);
              void refresh();
            }}
          >
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/search">Go to Search</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !orgLoaded || !profile?.organization_id) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="relative max-w-4xl mx-auto pb-32 sm:pb-12">
      <Link to="/app/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> {addOnly ? "Back to search" : "Skip to search"}
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
              Add facilities and insurance
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">List your facilities and share your link</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Add programs and insurance contracts by hand
              {canImportPdf ? ", or import a one-pager if you have one" : ""}. Keep contacts and levels of care accurate so partners reopen the right page.
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
                <Input type="text" inputMode="url" placeholder="https://" value={org.website} onChange={(e) => updateOrg("website", e.target.value)} />
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
      {showHowChooser && (
        <div className="space-y-4 animate-fade-up">
          <div className="text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold">How do you want to add facilities?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You can import a PDF one-pager now, or enter programs and insurance yourself.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/app/facilities/upload-pdf?from=onboarding")}
              className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 text-left transition-colors hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md mb-4">
                <Wand2 className="h-5 w-5" />
              </div>
              <p className="font-heading font-semibold">Import from a PDF</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drop a one-pager or insurance list. We’ll read facilities and payers — you confirm before anything saves.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAddingHow("manual")}
              className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 text-left transition-colors hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="h-10 w-10 rounded-xl bg-muted text-foreground grid place-items-center mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <p className="font-heading font-semibold">Add facilities manually</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter each program, location, insurance, and BD contact yourself.
              </p>
            </button>
          </div>
          <div className="text-center pt-2">
            <Button variant="ghost" onClick={() => navigate("/app/search")}>
              <SearchIcon className="h-4 w-4" /> Skip for now — search the network
            </Button>
          </div>
        </div>
      )}

      {showManualFacilities && (
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
              organizationId={profile?.organization_id}
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

            {totalContracts === 0 ? (
              <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-warning-foreground">
                  No in-network insurance yet. Partners search by who accepts what — add payers now, or after you submit.
                </p>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setStep(2)}>
                  Add insurance
                </Button>
              </div>
            ) : null}

            {missingReferralContact ? (
              <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-warning-foreground">
                  Search only shows who to call when a facility has a name plus a phone or email.
                </p>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setStep(2)}>
                  Add contact
                </Button>
              </div>
            ) : null}

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
      {!showHowChooser && (
      <div className="fixed bottom-0 left-0 right-0 sm:static sm:mt-8 z-30">
        <div className="bg-card/95 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none border-t border-border sm:border-0 px-4 py-3 sm:p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 2 && addingHow === "manual" && !addOnly && canImportPdf) {
                  setAddingHow("undecided");
                  return;
                }
                setStep((s) => Math.max(1, s - 1));
              }}
              disabled={(step === 1 && addingHow !== "manual") || saving}
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
      )}
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
