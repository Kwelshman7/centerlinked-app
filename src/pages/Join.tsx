import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getEmailDomain, isEmailAuthAllowed, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { applySocialMeta } from "@/lib/social-meta";
import { notifyAuthEvent } from "@/lib/transactional-email";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { PlanTypeChecklist } from "@/components/app/facility/PlanTypeChecklist";
import { emptyFacility } from "@/components/app/facility/facility-types";
import { saveFacilityWithContracts } from "@/lib/save-facility";
import { sanitizePlanTypes } from "@/lib/plan-types";
import { US_STATES } from "@/lib/us-states";

const DRAFT_KEY = "cl_join_draft";

type LocationRow = { name: string; city: string; state: string };
type PayerRow = { id: string | null; name: string; plan_types: string[] };

type JoinDraft = {
  orgName: string;
  bdName: string;
  phone: string;
  contactEmail: string;
  locations: LocationRow[];
  payers: PayerRow[];
};

function emptyLocation(): LocationRow {
  return { name: "", city: "", state: "" };
}

function readDraft(): JoinDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JoinDraft;
    if (!parsed?.orgName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(draft: JoinDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export default function Join() {
  const navigate = useNavigate();
  const { user, profile, loading, refresh } = useAuth();
  const needsAccount = !user;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [bdName, setBdName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [locations, setLocations] = useState<LocationRow[]>([emptyLocation()]);
  const [payers, setPayers] = useState<PayerRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  useEffect(() => {
    applySocialMeta({
      title: "Join CenterLinked",
      description: "Create your treatment organization profile, locations, and in-network contracts.",
      path: "/join",
    });
  }, []);

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    setOrgName(draft.orgName);
    setBdName(draft.bdName);
    setPhone(draft.phone);
    setContactEmail(draft.contactEmail);
    setLocations(draft.locations.length ? draft.locations : [emptyLocation()]);
    setPayers(
      (draft.payers ?? []).map((p) => ({
        ...p,
        plan_types: sanitizePlanTypes(p.plan_types),
      })),
    );
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && profile?.organization_id) {
      navigate("/app", { replace: true });
    }
  }, [loading, user, profile?.organization_id, navigate]);

  const snapshot = (): JoinDraft => ({
    orgName: orgName.trim(),
    bdName: bdName.trim(),
    phone: phone.trim(),
    contactEmail: contactEmail.trim(),
    locations,
    payers,
  });

  const createOrgAndFacilities = async () => {
    const sessionUser = (await supabase.auth.getUser()).data.user;
    if (!sessionUser?.email) {
      toast.error("Sign in required");
      return false;
    }

    const domain = getEmailDomain(sessionUser.email);
    const first = locations.find((l) => l.city.trim() && l.state);
    const { data: orgId, error } = await supabase.rpc("create_organization_with_owner", {
      _name: orgName.trim(),
      _email_domain: domain,
      _website: null,
      _hq_city: first?.city.trim() || null,
      _hq_state: first?.state || null,
      _description: null,
      _phone: phone.trim() || null,
      _num_facilities: locations.filter((l) => l.city.trim() && l.state).length || null,
      _logo_url: null,
    });

    if (error) {
      const isDuplicate =
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique");
      toast.error(
        isDuplicate
          ? "Someone from your domain already created an organization"
          : error.message,
        isDuplicate
          ? { description: "Request to join the existing organization for your email domain." }
          : undefined,
      );
      if (isDuplicate) {
        clearDraft();
        navigate("/setup-organization", { replace: true });
      }
      return false;
    }

    if (orgId && (bdName.trim() || phone.trim() || contactEmail.trim())) {
      const { error: bdError } = await supabase
        .from("organizations")
        .update({
          bd_contact_name: bdName.trim() || null,
          bd_contact_phone: phone.trim() || null,
          bd_contact_email: contactEmail.trim() || null,
        })
        .eq("id", orgId);
      if (bdError) {
        toast.error("Organization created, but referral contact didn't save", {
          description: bdError.message,
        });
      }
    }

    const contracts = payers
      .filter((p) => p.name.trim())
      .map((p) => ({
        payer_id: p.id,
        payer_name: p.name.trim(),
        in_network: true,
        plan_types: sanitizePlanTypes(p.plan_types),
      }));

    const usable = locations.filter((l) => l.city.trim() && l.state);
    for (const loc of usable) {
      const draft = emptyFacility();
      draft.name = loc.name.trim() || `${orgName.trim()} — ${loc.city.trim()}`;
      draft.city = loc.city.trim();
      draft.state = loc.state;
      draft.phone = phone.trim();
      draft.bd_contact_name = bdName.trim();
      draft.bd_contact_phone = phone.trim();
      draft.bd_contact_email = contactEmail.trim();
      draft.contracts = contracts;
      const saved = await saveFacilityWithContracts({
        organizationId: String(orgId),
        draft,
        contractsMode: contracts.length ? "in_network" : "none",
      });
      if (!saved.ok) {
        toast.error("Organization created, but a location didn’t save", {
          description: saved.error,
        });
      }
    }

    clearDraft();
    await refresh();
    toast.success("You’re on CenterLinked", {
      description: "Your organization is pending verification. You can keep adding details anytime.",
    });
    navigate("/app", { replace: true });
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    if (!bdName.trim()) {
      toast.error("BD rep name is required");
      return;
    }
    if (!phone.trim() || !contactEmail.trim()) {
      toast.error("Add a contact phone and email for referrals");
      return;
    }
    const usable = locations.filter((l) => l.city.trim() && l.state);
    if (usable.length === 0) {
      toast.error("Add at least one location (city and state)");
      return;
    }

    writeDraft(snapshot());
    setSaving(true);

    try {
      if (needsAccount) {
        if (!fullName.trim() || !email.trim() || !password) {
          toast.error("Fill in your name, work email, and password");
          return;
        }
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        const allowed = await isEmailAuthAllowed(email);
        if (!allowed) {
          toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
            description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data.session) {
          setAwaitingEmail(true);
          toast.success("Check your inbox", {
            description: "Confirm your email, then return to this page or sign in to finish.",
            duration: 8000,
          });
          return;
        }
        notifyAuthEvent("signup", fullName.trim());
      }

      await createOrgAndFacilities();
    } finally {
      setSaving(false);
    }
  };

  if (loading || (user && profile?.organization_id)) {
    return (
      <main className="min-h-screen grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-10 sm:py-14 overflow-hidden bg-hero-gradient">
      <div className="absolute top-0 right-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />

      <div className="w-full max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center"><Logo to="/" size="lg" /></div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mt-4">
              Join CenterLinked
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Create your account and organization. Add locations and who you are in-network with.
              Your profile stays private until CenterLinked approves it.
            </p>
          </div>

          {awaitingEmail ? (
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5 text-center space-y-3">
              <p className="font-heading font-semibold">Confirm your work email</p>
              <p className="text-sm text-muted-foreground">
                We saved this form. After you click the confirmation link, come back here or sign in
                and we will finish your organization.
              </p>
              <Button asChild variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {needsAccount ? (
                <section className="space-y-3">
                  <h2 className="font-heading text-sm font-semibold">Your account</h2>
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Your name</Label>
                    <Input id="full-name" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                </section>
              ) : null}

              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold">Organization</h2>
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your treatment organization" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bd-name">BD rep</Label>
                  <Input id="bd-name" value={bdName} onChange={(e) => setBdName(e.target.value)} placeholder="Who receives referrals" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact email</Label>
                    <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="referrals@company.com" />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-sm font-semibold">Locations</h2>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLocations((rows) => [...rows, emptyLocation()])}>
                    <Plus className="h-3.5 w-3.5" /> Add location
                  </Button>
                </div>
                <div className="space-y-3">
                  {locations.map((loc, i) => (
                    <div key={i} className="rounded-xl border border-border/70 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">Location {i + 1}</p>
                        {locations.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => setLocations((rows) => rows.filter((_, idx) => idx !== i))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Location name (optional)</Label>
                        <Input
                          value={loc.name}
                          onChange={(e) =>
                            setLocations((rows) => rows.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))
                          }
                          placeholder="Defaults to organization + city"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={loc.city}
                            onChange={(e) =>
                              setLocations((rows) => rows.map((row, idx) => (idx === i ? { ...row, city: e.target.value } : row)))
                            }
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Select
                            value={loc.state || "_none"}
                            onValueChange={(v) =>
                              setLocations((rows) =>
                                rows.map((row, idx) => (idx === i ? { ...row, state: v === "_none" ? "" : v } : row)),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              <SelectItem value="_none">State</SelectItem>
                              {US_STATES.map((s) => (
                                <SelectItem key={s.code} value={s.code}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold">In-network insurance</h2>
                <p className="text-xs text-muted-foreground">
                  Applied to every location. You can add more later.
                </p>
                <PayerCombobox
                  payerId={null}
                  payerName=""
                  approvedOnly
                  placeholder="Add a payer"
                  triggerClassName="w-full font-normal"
                  onSelect={(p) => {
                    if (!p.name) return;
                    setPayers((rows) =>
                      rows.some((row) => (p.id && row.id === p.id) || row.name.toLowerCase() === p.name.toLowerCase())
                        ? rows
                        : [...rows, { id: p.id, name: p.name, plan_types: [] }],
                    );
                  }}
                />
                {payers.length > 0 ? (
                  <ul className="space-y-2">
                    {payers.map((p, i) => (
                      <li
                        key={`${p.id ?? p.name}`}
                        className="rounded-lg border border-border/80 bg-background px-3 py-2.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{p.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => setPayers((rows) => rows.filter((row) => row !== p))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <PlanTypeChecklist
                          value={p.plan_types}
                          onChange={(plan_types) =>
                            setPayers((rows) =>
                              rows.map((row) =>
                                (p.id && row.id === p.id) || row.name === p.name
                                  ? { ...row, plan_types }
                                  : row,
                              ),
                            )
                          }
                          showHelper={i === 0}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create my organization"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
