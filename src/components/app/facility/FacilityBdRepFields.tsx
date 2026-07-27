import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgTeamMembers } from "@/hooks/useOrgTeamMembers";
import { cn } from "@/lib/utils";

export interface BdContactValue {
  bd_contact_name: string;
  bd_contact_phone: string;
  bd_contact_email: string;
}

interface Props {
  organizationId?: string | null;
  value: BdContactValue;
  onChange: (next: BdContactValue) => void;
  className?: string;
}

const NONE = "__none__";
const CUSTOM = "__custom__";

/**
 * Assign a facility BD rep from the org team, with optional manual override.
 * Writes denormalized bd_contact_* fields used on the public facility sheet.
 */
export function FacilityBdRepFields({ organizationId, value, onChange, className }: Props) {
  const { members, loading } = useOrgTeamMembers(organizationId);

  const matched = members.find(
    (m) =>
      (value.bd_contact_email &&
        m.email &&
        m.email.toLowerCase() === value.bd_contact_email.toLowerCase()) ||
      (value.bd_contact_name &&
        m.full_name.toLowerCase() === value.bd_contact_name.trim().toLowerCase() &&
        (!value.bd_contact_email || !m.email)),
  );

  const selectValue = !value.bd_contact_name.trim()
    ? NONE
    : matched
      ? matched.user_id
      : CUSTOM;

  const assignMember = (userId: string) => {
    if (userId === NONE) {
      onChange({ bd_contact_name: "", bd_contact_phone: "", bd_contact_email: "" });
      return;
    }
    if (userId === CUSTOM) return;
    const member = members.find((m) => m.user_id === userId);
    if (!member) return;
    onChange({
      bd_contact_name: member.full_name,
      bd_contact_phone: member.phone ?? "",
      bd_contact_email: member.email ?? "",
    });
  };

  return (
    <div className={cn("rounded-xl border border-border bg-muted/20 p-4 space-y-3", className)}>
      <div className="space-y-1">
        <Label className="text-sm">Assigned BD rep</Label>
        <p className="text-xs text-muted-foreground">
          Pick a team member for this facility&apos;s referral contact card. Visitors see them on
          the public facility page.
        </p>
      </div>

      {organizationId ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Team member</Label>
          <Select
            value={selectValue}
            onValueChange={assignMember}
            disabled={loading}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={loading ? "Loading team…" : "Select a team member"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No BD rep assigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.full_name}
                  {m.job_title ? ` · ${m.job_title}` : ""}
                  {!m.phone && !m.email ? " (add phone/email in profile)" : ""}
                </SelectItem>
              ))}
              {selectValue === CUSTOM && (
                <SelectItem value={CUSTOM}>Custom contact</SelectItem>
              )}
            </SelectContent>
          </Select>
          {members.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">
              No team members yet. Invite BD reps from Members, or enter contact details below.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <Input
          placeholder="Full name"
          value={value.bd_contact_name}
          onChange={(e) => onChange({ ...value, bd_contact_name: e.target.value })}
        />
        <Input
          placeholder="Phone"
          value={value.bd_contact_phone}
          onChange={(e) => onChange({ ...value, bd_contact_phone: e.target.value })}
        />
        <Input
          placeholder="Email"
          type="email"
          value={value.bd_contact_email}
          onChange={(e) => onChange({ ...value, bd_contact_email: e.target.value })}
        />
      </div>
    </div>
  );
}
