import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2, Share2, MapPin, Phone, Mail, Globe, Shield, Users, FileText, Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import logoRidgeview from "@/assets/logo-ridgeview.png";
import logoNorthbendPhp from "@/assets/logo-northbend-php.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-10 sm:py-14 lg:pt-6 lg:pb-12">
      <div className="container relative z-10">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />{"\u00a0"}Built for behavioral health BD teams
              </div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] leading-[1.05]">
                One link that tells referral partners{" "}
                <span className="text-primary">everything they need to know.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Your levels of care, accepted insurance, facility locations, and the right contact all in one live, shareable profile. No more outdated PDFs. No more "let me check and get back to you."
              </p>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
              <Button asChild variant="hero" size="xl" className="group w-full sm:w-auto">
                <Link to="/request-access">
                  Create Your Free Profile
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Free early access. No credit card required.
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "150ms" }}>
              {[
                "Your levels of care (Detox, Residential, PHP, IOP, OP)",
                "Who you're in-network with — verified",
                "Which facilities you operate and where",
                "The right admissions and BD contacts",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-slide-in-right relative flex justify-center">
            <div className="relative">
              {/* Deep ambient glow for depth */}
              <div className="absolute -inset-16 bg-primary/8 blur-[80px] rounded-full opacity-70" />
              <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-60" />
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[70%] h-24 bg-foreground/5 blur-2xl rounded-full" />
              <IPhoneOrgDashboard />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/4 right-1/4 -z-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
    </section>
  );
}

function IPhoneOrgDashboard() {
  return (
    <div
      className="relative mx-auto w-[260px] sm:w-[290px] lg:w-[300px]"
      style={{ aspectRatio: "393 / 852" }}
    >
      {/* iPhone 16 Pro frame */}
      <div className="absolute inset-0 rounded-[3.2rem] bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl shadow-glow p-[5px]">
        <div className="relative h-full w-full rounded-[2.95rem] bg-black p-[2px]">
          {/* Side buttons */}
          <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -left-[3px] top-[240px] h-14 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -right-[3px] top-[190px] h-20 w-[3px] rounded-r-sm bg-neutral-700" />

          <div className="relative h-full w-full rounded-[2.85rem] overflow-hidden bg-background">
            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 h-11 flex items-center justify-between px-7 z-30 text-foreground">
              <span className="text-[11px] font-semibold tracking-tight">9:41</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold">
                <span>5G</span>
                <span>●●●●</span>
              </span>
            </div>

            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[30px] w-[110px] rounded-full bg-black z-40 flex items-center justify-end pr-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-blink" />
            </div>

            {/* Static content (auto-scroll disabled) */}
            <div className="absolute inset-0 pt-11 overflow-hidden bg-background">
              <OrgDashboardContent />
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-foreground/80 z-40" />

            {/* Top & bottom gradient fades */}
            <div className="pointer-events-none absolute top-11 inset-x-0 h-8 bg-gradient-to-b from-background to-transparent z-20" />
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-background to-transparent z-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgDashboardContent() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-2 pb-3 flex items-center justify-between bg-background border-b border-border">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-4 w-auto object-contain"
          draggable={false}
        />
        <div className="flex items-center gap-2">
          <button className="relative h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <Bell className="h-3 w-3 text-foreground" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>

      {/* Hero cover */}
      <div className="relative h-32 overflow-hidden">
        <img src={northbendCover} alt="Northbend Recovery facility" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Org identity */}
      <div className="px-4 -mt-8 relative">
        <div className="h-16 w-16 rounded-2xl bg-white border-4 border-background shadow-lg flex items-center justify-center overflow-hidden p-1.5">
          <img src={logoNorthbend} alt="Northbend Recovery logo" className="h-full w-full object-contain" />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-heading font-bold text-[15px] text-foreground leading-tight">Northbend Recovery</h3>
            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Asheville, NC · 4 facilities
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button className="h-8 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center gap-1">
            <Share2 className="h-3 w-3" /> Share
          </button>
          <button className="h-8 rounded-lg bg-muted text-foreground text-[10px] font-bold flex items-center justify-center gap-1">
            <Phone className="h-3 w-3" /> Call
          </button>
          <button className="h-8 rounded-lg bg-muted text-foreground text-[10px] font-bold flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" /> Email
          </button>
        </div>
      </div>

      {/* About */}
      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">About</p>
        <p className="text-[10.5px] text-foreground leading-snug">
          Dual-diagnosis treatment across the full continuum of care — Detox, Residential, PHP & IOP — in the Blue Ridge mountains.
        </p>
      </div>

      {/* Levels of care */}
      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Levels of Care</p>
        <div className="flex flex-wrap gap-1">
          {["Detox","Residential","PHP","IOP","OP","MAT"].map(l => (
            <span key={l} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l}</span>
          ))}
        </div>
      </div>

      {/* In-network */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">In-Network Payers</p>
          <span className="text-[8.5px] text-success font-bold flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" /> Verified</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {["Aetna","Cigna","BCBS NC","United","Magellan","Optum"].map(p => (
            <div key={p} className="flex items-center gap-1.5 bg-card border border-border rounded-md px-2 py-1.5">
              <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
              <span className="text-[10px] font-semibold text-foreground truncate">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facilities */}
      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Facilities</p>
        <div className="space-y-1.5">
          {[
            { name: "Northbend Detox", loc: "Asheville, NC", logo: logoNorthbend },
            { name: "Ridgeview Residential", loc: "Black Mountain, NC", logo: logoRidgeview },
            { name: "Northbend PHP/IOP", loc: "Asheville, NC", logo: logoNorthbendPhp },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
              <div className="h-9 w-9 rounded-lg bg-white border border-border shrink-0 flex items-center justify-center p-1 overflow-hidden">
                <img src={f.logo} alt={`${f.name} logo`} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold text-foreground truncate leading-tight">{f.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{f.loc}</p>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* BD team */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">BD Team</p>
          <span className="text-[9px] text-primary font-bold flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> 4 reps</span>
        </div>
        <div className="space-y-1.5">
          {[
            { i: "EM", n: "Elena Martinez", r: "Director of BD", c: "from-rose-500 to-pink-600" },
            { i: "DK", n: "Derek Kim", r: "Sr. BD Manager", c: "from-blue-500 to-indigo-600" },
          ].map(m => (
            <div key={m.n} className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.c} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{m.i}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold text-foreground truncate leading-tight">{m.n}</p>
                <p className="text-[9px] text-muted-foreground truncate">{m.r}</p>
              </div>
              <button className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Mail className="h-2.5 w-2.5 text-primary" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Gallery</p>
        <div className="grid grid-cols-3 gap-1">
          {["from-emerald-300 to-teal-500","from-blue-300 to-indigo-500","from-amber-300 to-orange-500","from-rose-300 to-pink-500","from-violet-300 to-purple-500","from-cyan-300 to-sky-500"].map((g,i) => (
            <div key={i} className={`aspect-square rounded-md bg-gradient-to-br ${g}`} />
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="px-4 mt-4">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Documents</p>
        <div className="space-y-1.5">
          {["Program one-pager.pdf","Clinical outcomes 2025.pdf"].map(d => (
            <div key={d} className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5">
              <div className="h-7 w-7 rounded-md bg-rose-500/10 flex items-center justify-center">
                <FileText className="h-3 w-3 text-rose-600" />
              </div>
              <span className="text-[10px] font-semibold text-foreground truncate flex-1">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="px-4 mt-4 mb-6">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Contact</p>
        <div className="space-y-1 bg-card border border-border rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-[10px] text-foreground"><Phone className="h-3 w-3 text-primary" /> (828) 555-0142</div>
          <div className="flex items-center gap-2 text-[10px] text-foreground"><Mail className="h-3 w-3 text-primary" /> admissions@northbend.co</div>
          <div className="flex items-center gap-2 text-[10px] text-foreground"><Globe className="h-3 w-3 text-primary" /> northbendrecovery.com</div>
        </div>
      </div>
    </div>
  );
}
