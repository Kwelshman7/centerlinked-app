import { Button } from "@/components/ui/button";
import { UserPlus, Check, Clock } from "lucide-react";
import type { ConnectionStatus } from "@/lib/professional-network";
import { cn } from "@/lib/utils";

interface Props {
  status?: ConnectionStatus | null;
  busy?: boolean;
  onConnect?: () => void;
  onAccept?: () => void;
  className?: string;
}

export function ConnectButton({ status, busy, onConnect, onAccept, className }: Props) {
  if (status === "self") return null;
  if (status === "accepted") {
    return (
      <Button variant="outline" size="sm" className={cn("h-8 px-2.5 text-xs", className)} disabled>
        <Check className="h-3.5 w-3.5" />
        Connected
      </Button>
    );
  }
  if (status === "pending_out" || status === "pending") {
    return (
      <Button variant="outline" size="sm" className={cn("h-8 px-2.5 text-xs", className)} disabled>
        <Clock className="h-3.5 w-3.5" />
        Invited
      </Button>
    );
  }
  if (status === "pending_in" && onAccept) {
    return (
      <Button size="sm" className={cn("h-8 px-3 text-xs", className)} onClick={onAccept} disabled={busy}>
        Accept
      </Button>
    );
  }
  if (status === "blocked") {
    return (
      <Button variant="outline" size="sm" className={cn("h-8 px-2.5 text-xs", className)} disabled>
        Unavailable
      </Button>
    );
  }
  return (
    <Button size="sm" className={cn("h-8 px-3 text-xs", className)} onClick={onConnect} disabled={busy || !onConnect}>
      <UserPlus className="h-3.5 w-3.5" />
      Invite
    </Button>
  );
}
