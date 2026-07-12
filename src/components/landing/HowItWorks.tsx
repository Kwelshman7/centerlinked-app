import {
  ShieldCheck,
  Users,
  Link2,
  MapPin,
  ClipboardList,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const profilePieces = [
  {
    icon: Building2,
    title: "Who you are & where you treat",
    description: "Organization story, facilities, and locations partners can scan in seconds.",
  },
  {
    icon: MapPin,
    title: "Levels of care",
    description: "Detox through outpatient — clear enough for a clinical referral decision.",
  },
  {
    icon: ShieldCheck,
    title: "Verified insurance",
    description: "Named in-network payers, kept current — not \"we take most insurance.\"",
  },
  {
    icon: Users,
    title: "The right BD contact",
    description: "Name, phone, and email. When a rep turns over, update once for everyone.",
  },
  {
    icon: ClipboardList,
    title: "How to refer",
    description: "Referral phone, email, and next steps so partners know exactly what to do.",
  },
  {
    icon: Link2,
    title: "One shareable link",
    description: "Send after meetings, conferences, or program updates. No attachments. No re-sends.",
  },
];

const moments = [
  {
    title: "After a partner meeting",
    body: "Text or email your CenterLinked link instead of a PDF. It stays current long after the handshake.",
  },
  {
    title: "At a conference",
    body: "Share one URL on a badge, QR, or follow-up. Every conversation points to the same live profile.",
  },
  {
    title: "When something changes",
    body: "New program, new payer, new BD rep — update the profile once. Every partner sees it immediately.",
  },
  {
    title: "When a partner asks \"do you take…?\"",
    body: "Send the link. They verify insurance and LOC themselves — without phone tag.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            How It Works
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            One link your partners can{" "}
            <span className="text-primary">actually use.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Build your organization's live referral profile once. Share it everywhere.
            When you update insurance, contacts, or programs, every shared link stays current —
            no mass emails, no new PDFs.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {profilePieces.map((b) => (
            <div
              key={b.title}
              className="group p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 sm:mt-16 mx-auto max-w-5xl">
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground text-center tracking-tight">
            Use it wherever referrals start
          </h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {moments.map((m) => (
              <div
                key={m.title}
                className="p-4 sm:p-5 rounded-xl border border-border bg-secondary/40"
              >
                <p className="font-semibold text-sm text-foreground">{m.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <Button asChild variant="hero" size="lg" className="group">
            <Link to="/request-access">
              Create Your Free Profile
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
