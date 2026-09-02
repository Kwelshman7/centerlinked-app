import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notifyPricingInquiry } from "@/lib/transactional-email";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultEmail?: string;
};

export function PricingInquiryDialog({ open, onOpenChange, defaultName = "", defaultEmail = "" }: Props) {
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: defaultName, email: defaultEmail, phone: "", question: "" });

  useEffect(() => {
    if (!open) return;
    setForm({ name: defaultName, email: defaultEmail, phone: "", question: "" });
  }, [open, defaultName, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await notifyPricingInquiry(form);
      toast.success("Message sent. We’ll get back to you shortly.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send us a message</DialogTitle>
          <DialogDescription>
            Ask a question about CenterLinked. We’ll reply to the email you provide.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="pricing-inquiry-name">Name</Label>
            <Input
              id="pricing-inquiry-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricing-inquiry-email">Email</Label>
            <Input
              id="pricing-inquiry-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricing-inquiry-phone">Phone</Label>
            <Input
              id="pricing-inquiry-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              autoComplete="tel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricing-inquiry-question">Question about the platform</Label>
            <Textarea
              id="pricing-inquiry-question"
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              rows={4}
              required
              minLength={10}
              maxLength={2000}
            />
          </div>
          <Button type="submit" variant="hero" className="w-full rounded-full" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send message
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
