import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Share2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Users,
  FileText,
  Bell,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PhoneFrame } from "./PhoneFrame";
import { OrgLogoCarousel } from "./OrgLogoCarousel";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import logoRidgeview from "@/assets/logo-ridgeview.png";
import logoNorthbendPhp from "@/assets/logo-northbend-php.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

export function Hero() {
  return (
    <section className="relative flex flex-col overflow-hidden bg-hero-gradient min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] lg:min-h-0 pt-10 sm:pt-14 lg:pt-12">
      <div className="pointer-events-none absolute inset-0 landing-glow" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-32 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="container relative z-10 flex-1 flex flex-col justify-center pb-10 sm:pb-12 lg:pb-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:items-center">
          <div className="space-y-7 max-w-xl">
            <div className="space-y-5 animate-fade-up">
              <p className="font-sans text-sm sm:text-base font-semibold tracking-[0.1em] uppercase text-primary">
                CenterLinked
              </p>
              <DisplayHeading as="h1">
                Stop Sending Outdated{" "}
                <DisplayAccent>Referral Brochures.</DisplayAccent>
              </DisplayHeading>
              <div className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                <p>
                  Give your organization one live referral profile that stays current, is easy
                  to share, and helps referral partners quickly determine if you&apos;re the
                  right fit.
                </p>
                <p className="text-sm sm:text-base">
                  Instead of emailing PDFs, outdated one-pagers, and answering the same referral
                  questions over and over, simply share your CenterLinked profile.
                </p>
                <p className="text-sm sm:text-base">
                  Every profile is managed from your organization dashboard and can be updated
                  anytime.
                </p>
              </div>
            </div>

            <div
              className="animate-fade-up flex flex-col sm:flex-row gap-3"
              style={{ animationDelay: "100ms" }}
            >
              <Button asChild variant="hero" size="xl" className="group w-full sm:w-auto">
                <Link to="/request-access">
                  Claim Your Organization Profile
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="xl" className="w-full sm:w-auto">
                <a href="#example">View Example Profile</a>
              </Button>
            </div>
          </div>

          <div className="animate-slide-in-right relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-16 bg-primary/8 blur-[80px] rounded-full opacity-70" />
              <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-60" />
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[70%] h-20 bg-foreground/5 blur-2xl rounded-full" />
              <PhoneFrame className="w-[260px] sm:w-[290px] lg:w-[300px] animate-float">
                <OrgDashboardContent />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>

      <OrgLogoCarousel className="relative z-10 mt-auto" />
    </section>
  );
}

function OrgDashboardContent() {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-2 pb-3 flex items-center justify-between bg-background border-b border-border">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-4 w-auto object-contain"
          draggable={false}
        />
        <button
          type="button"
          className="relative h-7 w-7 rounded-full bg-muted flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="h-3 w-3 text-foreground" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
      </div>

      <div className="relative h-32 overflow-hidden">
        <img
          src={northbendCover}
          alt="Northbend Recovery facility"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="h-16 w-16 rounded-2xl bg-white border-4 border-background shadow-lg flex items-center justify-center overflow-hidden p-1.5">
          <img
            src={logoNorthbend}
            alt="Northbend Recovery logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-[15px] text-foreground leading-tight">
              Northbend Recovery
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" /> Asheville, NC · 4 facilities
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            className="h-8 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Share2 className="h-3 w-3" /> Share
          </button>
          <button
            type="button"
            className="h-8 rounded-lg bg-muted text-foreground text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Phone className="h-3 w-3" /> Call
          </button>
          <button
            type="button"
            className="h-8 rounded-lg bg-muted text-foreground text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Mail className="h-3 w-3" /> Email
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
          About
        </p>
        <p className="text-[10.5px] text-foreground leading-snug">
          Dual-diagnosis treatment across the full continuum of care — Detox, Residential, PHP &
          IOP — in the Blue Ridge mountains.
        </p>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
          Levels of Care
        </p>
        <div className="flex flex-wrap gap-1">
          {["Detox", "Residential", "PHP", "IOP", "OP", "MAT"].map((l) => (
            <span
              key={l}
              className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
            In-Network Payers
          </p>
          <span className="text-[8.5px] text-success font-bold flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" /> Verified
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {["Aetna", "Cigna", "BCBS NC", "United", "Magellan", "Optum"].map((p) => (
            <div
              key={p}
              className="flex items-center gap-1.5 bg-card border border-border rounded-md px-2 py-1.5"
            >
              <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
              <span className="text-[10px] font-semibold text-foreground truncate">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
          Facilities
        </p>
        <div className="space-y-1.5">
          {[
            { name: "Northbend Detox", loc: "Asheville, NC", logo: logoNorthbend },
            { name: "Ridgeview Residential", loc: "Black Mountain, NC", logo: logoRidgeview },
            { name: "Northbend PHP/IOP", loc: "Asheville, NC", logo: logoNorthbendPhp },
          ].map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-2 bg-card border border-border rounded-xl p-2"
            >
              <div className="h-9 w-9 rounded-lg bg-white border border-border shrink-0 flex items-center justify-center p-1 overflow-hidden">
                <img
                  src={f.logo}
                  alt={`${f.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold text-foreground truncate leading-tight">
                  {f.name}
                </p>
                <p className="text-[9px] text-muted-foreground truncate">{f.loc}</p>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
            BD Team
          </p>
          <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" /> 4 reps
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            { i: "EM", n: "Elena Martinez", r: "Director of BD", c: "from-rose-500 to-pink-600" },
            { i: "DK", n: "Derek Kim", r: "Sr. BD Manager", c: "from-blue-500 to-indigo-600" },
          ].map((m) => (
            <div
              key={m.n}
              className="flex items-center gap-2 bg-card border border-border rounded-xl p-2"
            >
              <div
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.c} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
              >
                {m.i}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold text-foreground truncate leading-tight">
                  {m.n}
                </p>
                <p className="text-[9px] text-muted-foreground truncate">{m.r}</p>
              </div>
              <button
                type="button"
                className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center"
                aria-label={`Email ${m.n}`}
              >
                <Mail className="h-2.5 w-2.5 text-primary" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
          Documents
        </p>
        <div className="space-y-1.5">
          {["Program one-pager.pdf", "Clinical outcomes 2025.pdf"].map((d) => (
            <div
              key={d}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5"
            >
              <div className="h-7 w-7 rounded-md bg-rose-500/10 flex items-center justify-center">
                <FileText className="h-3 w-3 text-rose-600" />
              </div>
              <span className="text-[10px] font-semibold text-foreground truncate flex-1">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 mb-6">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
          Contact
        </p>
        <div className="space-y-1 bg-card border border-border rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-[10px] text-foreground">
            <Phone className="h-3 w-3 text-primary shrink-0" /> (828) 555-0142
          </div>
          <div className="flex items-center gap-2 text-[10px] text-foreground">
            <Mail className="h-3 w-3 text-primary shrink-0" /> admissions@northbend.co
          </div>
          <div className="flex items-center gap-2 text-[10px] text-foreground">
            <Globe className="h-3 w-3 text-primary shrink-0" /> northbendrecovery.com
          </div>
        </div>
      </div>
    </div>
  );
}
