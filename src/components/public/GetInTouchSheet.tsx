import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Mail, User, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trackOrgEvent } from "@/lib/track-org-event";

interface Props {
  orgName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  triggerLabel?: string;
  triggerClassName?: string;
  organizationId?: string;
}

function digits(p: string | null) {
  return p ? p.replace(/[^\d+]/g, "") : "";
}

export function GetInTouchSheet({ orgName, contactName, phone, email, triggerLabel = "Get in Touch", triggerClassName, organizationId }: Props) {
  const [open, setOpen] = useState(false);
  const tel = digits(phone);
  const hasAny = !!(tel || email);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && organizationId) {
      trackOrgEvent(organizationId, "referral_click");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="default" className={triggerClassName}>
          <MessageSquare className="h-4 w-4" /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading">Contact {orgName}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Reach the business-development lead directly.
          </p>
        </SheetHeader>

        {!hasAny ? (
          <p className="mt-6 text-sm text-muted-foreground">No contact on file yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {contactName && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">BD Rep</p>
                  <p className="font-semibold truncate">{contactName}</p>
                </div>
              </div>
            )}

            {tel && (
              <div className="rounded-xl border border-border/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="font-semibold truncate">{phone}</p>
                  <Button variant="ghost" size="sm" onClick={() => copy(phone!, "Phone")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${tel}`}><Phone className="h-4 w-4" /> Call</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={`sms:${tel}`}><MessageSquare className="h-4 w-4" /> Text</a>
                  </Button>
                </div>
              </div>
            )}

            {email && (
              <div className="rounded-xl border border-border/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="font-semibold truncate">{email}</p>
                  <Button variant="ghost" size="sm" onClick={() => copy(email, "Email")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <a href={`mailto:${email}`}><Mail className="h-4 w-4" /> Send Email</a>
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
