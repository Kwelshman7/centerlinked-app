import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { isPersonalEmail } from "@/lib/email-domains";

interface MemberRow { id: string; user_id: string; role_at_org: string; created_at: string; }
interface ProfileLite { user_id: string; full_name: string | null; avatar_url: string | null; job_title: string | null; email: string | null; }
interface InviteRow { id: string; email: string; role_at_org: string; status: string; created_at: string; }

export default function Members() {
  const { profile, user, isFacilityAdmin } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [orgDomain, setOrgDomain] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = async () => {
    if (!profile?.organization_id) return;
    const [{ data: org }, { data: mems }, { data: invs }] = await Promise.all([
      supabase.from("organizations").select("email_domain").eq("id", profile.organization_id).maybeSingle(),
      supabase.from("organization_members").select("*").eq("organization_id", profile.organization_id),
      supabase.from("org_invites").select("id,email,role_at_org,status,created_at").eq("organization_id", profile.organization_id).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setOrgDomain((org as { email_domain?: string } | null)?.email_domain ?? null);
    const list = (mems as MemberRow[]) ?? [];
    setMembers(list);
    setInvites((invs as InviteRow[]) ?? []);
    if (list.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,full_name,avatar_url,job_title,email").in("user_id", list.map((x) => x.user_id));
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p) => { map[(p as ProfileLite).user_id] = p as ProfileLite; });
      setProfiles(map);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.organization_id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !profile?.organization_id) return;
    if (isPersonalEmail(email)) {
      toast.error("Personal emails aren't allowed");
      return;
    }
    if (orgDomain && email.split("@")[1] !== orgDomain.toLowerCase()) {
      toast.error(`Email must be on @${orgDomain}`);
      return;
    }
    setInviting(true);
    const { error } = await supabase.from("org_invites").insert({
      organization_id: profile.organization_id,
      email,
      role_at_org: "bd_rep",
      invited_by: user?.id,
    });
    setInviting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already invited" : error.message);
      return;
    }
    toast.success("Invite added", { description: "They'll join automatically when they sign up with this email." });
    setInviteEmail("");
    load();
  };

  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from("org_invites").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setInvites((cur) => cur.filter((i) => i.id !== id));
  };

  const confirmRemove = async () => {
    if (!removeTarget || !profile?.organization_id) return;
    setRemoving(true);
    const { error } = await supabase.rpc("remove_org_member", {
      _member_user_id: removeTarget.user_id,
      _organization_id: profile.organization_id,
    });
    setRemoving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    setRemoveTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">BD reps in your organization. Invites must use your work email domain{orgDomain ? ` (@${orgDomain})` : ""}.</p>
      </div>

      {isFacilityAdmin && profile?.organization_id && (
        <Card className="p-5">
          <h2 className="font-heading text-base font-semibold mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Invite a BD Rep</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Work email</Label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={orgDomain ? `name@${orgDomain}` : "name@company.com"} />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending</> : <>Add invite</>}
            </Button>
          </form>
          {invites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending invites</p>
              <div className="divide-y divide-border rounded-md border">
                {invites.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{i.email}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">BD rep</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => cancelInvite(i.id)}>Cancel</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {members.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Invite your BD reps so they can access the network and share facility links with referral partners.
            </p>
          </div>
          {isFacilityAdmin && (
            <p className="text-sm text-primary font-medium">
              Use the invite form above to add your first team member.
            </p>
          )}
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {members.map((m) => {
            const p = profiles[m.user_id];
            const initials = (p?.full_name ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
            const isSelf = m.user_id === user?.id;
            return (
              <div key={m.id} className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : initials || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p?.full_name || "Member"}</p>
                  <p className="text-xs text-muted-foreground truncate">{p?.email}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{m.role_at_org.replace("_", " ")}</span>
                {isFacilityAdmin && !isSelf && m.role_at_org !== "facility_admin" && (
                  <Button variant="ghost" size="icon" onClick={() => setRemoveTarget(m)} aria-label="Remove member">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this BD rep?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll lose access to your organization immediately. You can re-invite them anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
