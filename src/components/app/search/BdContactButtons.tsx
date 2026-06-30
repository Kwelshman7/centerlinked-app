import { Phone, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizePhone } from "@/lib/phone";

interface Props {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  size?: "sm" | "default";
  className?: string;
  variant?: "outline" | "secondary";
}

export function BdContactButtons({ phone, email, size = "sm", className, variant = "outline" }: Props) {
  const tel = sanitizePhone(phone);
  const hasAny = !!(tel || email);
  if (!hasAny) {
    return <p className={cn("text-xs text-muted-foreground", className)}>No BD rep contact on file</p>;
  }
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tel && (
        <Button asChild size={size} variant={variant} className="flex-1 min-w-[88px]">
          <a href={`tel:${tel}`}><Phone className="h-3.5 w-3.5" />Call</a>
        </Button>
      )}
      {tel && (
        <Button asChild size={size} variant={variant} className="flex-1 min-w-[88px]">
          <a href={`sms:${tel}`}><MessageSquare className="h-3.5 w-3.5" />Text</a>
        </Button>
      )}
      {email && (
        <Button asChild size={size} variant={variant} className="flex-1 min-w-[88px]">
          <a href={`mailto:${email}`}><Mail className="h-3.5 w-3.5" />Email</a>
        </Button>
      )}
    </div>
  );
}
