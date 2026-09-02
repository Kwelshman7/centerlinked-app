import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Clock, Check, X, Plus, Trash2, UserPlus } from "lucide-react";
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

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "pending" ? "secondary" : status === "approved" ? "default" : "destructive";
  return (
    <Badge variant={variant} className="capitalize whitespace-nowrap">
      {status === "pending" && <Clock className="h-3 w-3 mr-1" />}
      {status}
    </Badge>
  );
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
    const [{ data, error }, { data: allowData, error: allowError }, { data: orgData }] =
      await Promise.all([
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
        toast.error(
          emailErr instanceof Error ? emailErr.message : "Assigned, but the email did not send",
        );
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
          are linked immediately; otherwise they land on that organization the first time they sign
          in.
        </p>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[140px]">Name</TableHead>
                <TableHead className="min-w-[180px]">Email</TableHead>
                <TableHead className="min-w-[160px]">Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Facilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="min-w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="font-medium leading-snug">{r.full_name}</p>
                      {isPersonalEmail(r.email) ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-700 border-amber-500/40"
                        >
                          Personal email
                        </Badge>
                      ) : null}
                      {r.notes ? (
                        <p
                          className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]"
                          title={r.notes}
                        >
                          {r.notes}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <a href={`mailto:${r.email}`} className="text-primary hover:underline break-all">
                      {r.email}
                    </a>
                  </TableCell>
                  <TableCell className="align-top font-medium">{r.organization}</TableCell>
                  <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                    {r.role || "—"}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                    {r.facilities || "—"}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {r.status === "pending" ? (
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void setStatus(r, "denied")}
                        >
                          <X className="h-4 w-4" /> Deny
                        </Button>
                        <Button size="sm" onClick={() => void setStatus(r, "approved")}>
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                      </div>
                    ) : r.status === "approved" ? (
                      <div className="inline-flex flex-col items-stretch gap-1.5 min-w-[200px] ml-auto">
                        <select
                          aria-label={`Assign organization for ${r.full_name}`}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
                          value={assignOrgByRequest[r.id] ?? suggestedOrgId(r.organization)}
                          onChange={(e) =>
                            setAssignOrgByRequest((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select organization…</option>
                          {orgs.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
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
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Approved personal emails</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Exceptions that may sign in despite using Gmail/Yahoo/Outlook/etc. Company domains never
            need this list.
          </p>
        </div>

        <form
          onSubmit={addApprovedEmail}
          className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
        >
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
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Email</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[72px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((row) => (
                  <TableRow key={row.email}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell className="text-muted-foreground">{row.notes || "—"}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void removeApprovedEmail(row.email)}
                        aria-label={`Remove ${row.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        After Approve, use Assign & email. Create the organization first if it is not in the list.
      </p>
    </div>
  );
}
