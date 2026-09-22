import { useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Share /join so a BD rep can sign up and add their own org — no org membership required. */
export function InviteColleagueCard({
  title = "Invite other BD reps",
  description = "They sign up free with a work email, then can add their organization, facilities, and insurance contracts.",
  compact = false,
  inline = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
  inline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join`;
  const mailto = `mailto:?subject=${encodeURIComponent("Join me on CenterLinked")}&body=${encodeURIComponent(
    `I'm using CenterLinked to find who accepts what insurance and keep contracts current.\n\nCreate a free work-email account: ${joinUrl}\n`,
  )}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the invite link");
    }
  };

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copied" : "Copy invite link"}
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={mailto}>Email a colleague</a>
        </Button>
      </div>
    );
  }

  return (
    <Card className={compact ? "space-y-3 p-4" : "p-5 sm:p-6 space-y-3"}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copied" : "Copy invite link"}
        </Button>
        <Button asChild variant="outline">
          <a href={mailto}>Email a colleague</a>
        </Button>
      </div>
    </Card>
  );
}
