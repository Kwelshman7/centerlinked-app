import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Check, X, Mail, Plus, Trash2, UserPlus } from "lucide-react";
import { isPersonalEmail } from "@/lib/email-domains";
import { adminAssignUserToOrganization } from "@/lib/org-setup";
import { sendOrgWelcomeEmail } from "@/lib/transactional-email";

interface Request {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  role: string | null;
  facilities: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ApprovedPersonalEmail {
  email: string;
  notes: string | null;
  created_at: string;
}

interface OrgOption {
  id: string;
  name: string;
}

export default function AccessRequests() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [approved, setApproved] = useState<ApprovedPersonalEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualEmail, setManualEmail] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [savingAllow, setSavingAllow] = useState(false);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [assignOrgByRequest, setAssignOrgByRequest] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: allowData, error: allowError }, { data: orgData }] = await Promise.all([
      supabase.from("early_access_leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("approved_personal_emails")
        .select("email,notes,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("organizations").select("id,name").order("name"),
    ]);
    setOrgs((orgData as OrgOption[]) ?? []);

    if (error) {
      toast.error(error.message);
      setRequests([]);
    } else {
      setRequests(
        ((data as Request[]) ?? []).map((r) => ({
          ...r,
          status: r.status || "pending",
        })),
      );
    }

    if (allowError) {
      // Table may not be applied yet in older environments.
      console.warn("approved_personal_emails:", allowError.message);
      setApproved([]);
    } else {
      setApproved((allowData as ApprovedPersonalEmail[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin]);

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const approvePersonalIfNeeded = async (email: string, organization: string) => {
    if (!isPersonalEmail(email)) return;
    const { error } = await supabase.rpc("approve_personal_email", {
      _email: email.trim().toLowerCase(),
      _notes: `Approved via access request · ${organization}`,
    });
    if (error) {
      toast.error(`Approved request, but personal-email allowlist failed: ${error.message}`);
      return;
    }
    toast.message("Personal email approved for login", {
      description: `${email} can now sign in / sign up.`,
    });
  };

  const setStatus = async (req: Request, status: "approved" | "denied") => {
    const reviewedAt = new Date().toISOString();
    let { error } = await supabase
      .from("early_access_leads")
      .update({ status, reviewed_at: reviewedAt })
      .eq("id", req.id);

    // Older DBs may not have reviewed_at yet — still allow approve/deny.
    if (error?.message?.includes("reviewed_at")) {
      ({ error } = await supabase
        .from("early_access_leads")
        .update({ status })
        .eq("id", req.id));
    }

    if (error) {
      toast.error(error.message);
      return;
    }
    if (status === "approved") {
      await approvePersonalIfNeeded(req.email, req.organization);
    }
    toast.success(`Marked as ${status}`);
    void load();
  };

  const suggestedOrgId = (organizationName: string) => {
    const needle = organizationName.trim().toLowerCase();
    if (!needle) return "";
    const exact = orgs.find((o) => o.name.toLowerCase() === needle);
    if (exact) return exact.id;
    const partial = orgs.find(
      (o) => o.name.toLowerCase().includes(needle) || needle.includes(o.name.toLowerCase()),
    );
    return partial?.id ?? "";
  };

  const assignToOrg = async (req: Request) => {
    const organizationId = assignOrgByRequest[req.id] || suggestedOrgId(req.organization);
    if (!organizationId) {
      toast.error("Choose an organization first");
      return;
    }
    setAssigningId(req.id);
    try {
      const result = await adminAssignUserToOrganization({
        email: req.email,
        organizationId,
        roleAtOrg: "facility_admin",
      });
      try {
        await sendOrgWelcomeEmail({
          organization_id: organizationId,
          to_email: req.email,
          to_name: req.full_name,
          kind: "assigned",
          already_linked: result.linked,
        });
      } catch (emailErr) {
        toast.error(emailErr instanceof Error ? emailErr.message : "Assigned, but the email did not send");
        setAssigningId(null);
        return;
      }
      toast.success(
        result.linked
          ? `${req.full_name} is now the org admin`
          : `Invite sent — ${req.full_name} becomes admin on first sign-in`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign this user");
    } finally {
      setAssigningId(null);
    }
  };

  const addApprovedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = manualEmail.trim().toLowerCase();
    if (!email) return;
    if (!isPersonalEmail(email)) {
      toast.error("Only personal email domains need allowlisting", {
        description: "Company emails can already sign in.",
      });
      return;
    }
    setSavingAllow(true);
    const { error } = await supabase.rpc("approve_personal_email", {
      _email: email,
      _notes: manualNotes.trim() || null,
    });
    setSavingAllow(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Approved ${email} for login`);
    setManualEmail("");
    setManualNotes("");
    void load();
  };

  const removeApprovedEmail = async (email: string) => {
    const { error } = await supabase.from("approved_personal_emails").delete().eq("email", email);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Removed ${email}`);
    void load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Access requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve unlocks login. Then assign them as org admin — if they already have an account they
          are linked immediately; otherwise they land on that organization the first time they sign in.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No requests yet.</Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{r.full_name}</h3>
                    <Badge
                      variant={
                        r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"
                      }
                    >
                      {r.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {r.status}
                    </Badge>
                    {isPersonalEmail(r.email) ? (
                      <Badge variant="outline" className="text-amber-700 border-amber-500/40">
                        Personal email
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {r.organization}
                    {r.role && <> · {r.role}</>}
                    {r.facilities && <> · {r.facilities} facilities</>}
                  </p>
                  <a
                    href={`mailto:${r.email}`}
                    className="text-sm text-primary inline-flex items-center gap-1 mt-1 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" /> {r.email}
                  </a>
                  {r.notes && <p className="text-sm mt-2 p-3 bg-muted rounded-lg">{r.notes}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void setStatus(r, "denied")}>
                      <X className="h-4 w-4" /> Deny
                    </Button>
                    <Button size="sm" onClick={() => void setStatus(r, "approved")}>
                      <Check className="h-4 w-4" /> Approve login
                    </Button>
                  </div>
                )}
              </div>
              {r.status === "approved" && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-2 border-t border-border/50 pt-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor={`assign-org-${r.id}`}>Assign as organization admin</Label>
                    <select
                      id={`assign-org-${r.id}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={assignOrgByRequest[r.id] ?? suggestedOrgId(r.organization)}
                      onChange={(e) =>
                        setAssignOrgByRequest((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    >
                      <option value="">Select organization…</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={assigningId === r.id}
                    onClick={() => void assignToOrg(r)}
                  >
                    <UserPlus className="h-4 w-4" />
                    {assigningId === r.id ? "Assigning…" : "Assign & email"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Approved personal emails</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Exceptions that may sign in despite using Gmail/Yahoo/Outlook/etc. Company domains never need this list.
          </p>
        </div>

        <form onSubmit={addApprovedEmail} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="allow-email">Email</Label>
            <Input
              id="allow-email"
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="name@gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allow-notes">Notes</Label>
            <Input
              id="allow-notes"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Why this exception?"
            />
          </div>
          <Button type="submit" disabled={savingAllow || !manualEmail.trim()}>
            <Plus className="h-4 w-4" />
            Approve
          </Button>
        </form>

        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personal-email exceptions yet.</p>
        ) : (
          <ul className="space-y-2">
            {approved.map((row) => (
              <li
                key={row.email}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{row.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.notes || "No notes"} · {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeApprovedEmail(row.email)}
                  aria-label={`Remove ${row.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        After Approve login, use Assign & email. Create the organization first if it is not in the list.
      </p>
    </div>
  );
}
