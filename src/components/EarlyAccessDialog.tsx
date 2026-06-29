import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const earlyAccessSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  organization: z.string().trim().min(2, "Organization name is required").max(150),
  facilities: z.string().min(1, "Please select number of facilities"),
});

type EarlyAccessFormData = z.infer<typeof earlyAccessSchema>;

interface EarlyAccessDialogProps {
  children: ReactNode;
}

const facilityOptions = ["1", "2-5", "6-10", "11-25", "25+"];

export function EarlyAccessDialog({ children }: EarlyAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EarlyAccessFormData>({
    resolver: zodResolver(earlyAccessSchema),
    defaultValues: { name: "", email: "", organization: "", facilities: "" },
  });

  const facilitiesValue = watch("facilities");

  const onSubmit = async (data: EarlyAccessFormData) => {
    const { error } = await supabase.from("early_access_leads").insert({
      full_name: data.name,
      email: data.email,
      organization: data.organization,
      facilities: data.facilities,
    });
    if (error) {
      toast.error("Couldn't submit", { description: error.message });
      return;
    }
    setSubmitted(true);
    toast.success("You're on the list!", {
      description: "We'll verify your organization and reach out with access details.",
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        reset();
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground">
              You're on the list!
            </h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Thanks for requesting early access. We'll reach out soon with next steps.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="mt-6 w-full">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">
                Request Early Access
              </DialogTitle>
              <DialogDescription>
                Join the waitlist and lock in early access pricing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" autoFocus placeholder="Jane Doe" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@company.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name</Label>
                <Input
                  id="organization"
                  placeholder="Acme Treatment Centers"
                  {...register("organization")}
                />
                {errors.organization && (
                  <p className="text-xs text-destructive">{errors.organization.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilities">Number of Facilities</Label>
                <Select
                  value={facilitiesValue}
                  onValueChange={(v) =>
                    setValue("facilities", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="facilities">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilityOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.facilities && (
                  <p className="text-xs text-destructive">{errors.facilities.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Early Access"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
