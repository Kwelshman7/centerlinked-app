import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  FileText,
  Link2,
  Building2,
  BadgeCheck,
  MapPin,
  Star,
  Eye,
  Copy,
  Share2,
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  TrendingUp,
  XCircle,
  Send,
  Globe,
  Phone,
} from "lucide-react";
import { EarlyAccessDialog } from "@/components/EarlyAccessDialog";

type Step = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof FileText;
  visual: ReactNode;
  benefits: string[];
};

// ============= Browser Frame =============

function BrowserFrame({ children, url = "centerlinked.com/p/horizon-malibu" }: { children: ReactNode; url?: string }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-border bg-card ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/70 border-b border-border">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-background/80 border border-border flex items-center gap-1 text-[9px] text-muted-foreground min-w-0">
          <Lock className="h-2 w-2 text-success shrink-0" />
          <span className="font-mono truncate">{url}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ============= Step 1: The Problem — PDF vs Link =============

function ProblemMock() {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-border bg-card p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* PDF column */}
        <div className="relative rounded-lg border-2 border-dashed border-destructive/40 bg-destructive/[0.03] p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1.5">
            <XCircle className="h-3 w-3 text-destructive shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-destructive">Old way</span>
          </div>
          <div className="relative mx-auto w-full aspect-[3/4] bg-white rounded shadow border border-border overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100" />
            <div className="p-1.5 space-y-1">
              <div className="h-1 w-3/4 bg-slate-200 rounded" />
              <div className="h-1 w-1/2 bg-slate-200 rounded" />
              <div className="h-6 bg-slate-100 rounded mt-1" />
              <div className="h-1 w-2/3 bg-slate-200 rounded" />
              <div className="h-1 w-3/5 bg-slate-200 rounded" />
              <div className="h-1 w-1/2 bg-slate-200 rounded" />
            </div>
            <div className="absolute inset-x-1 bottom-1 text-[7px] text-slate-400 font-mono">
              one-pager-v7-FINAL.pdf
            </div>
            <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-destructive/90 text-white text-[7px] font-bold">
              OUTDATED
            </div>
          </div>
          <p className="text-[8.5px] sm:text-[9px] text-muted-foreground mt-2 leading-tight">
            Stale insurance lists. Wrong contact. Email attachment lost.
          </p>
        </div>

        {/* Link column */}
        <div className="relative rounded-lg border-2 border-primary/40 bg-primary/[0.04] p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1.5">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">CenterLinked</span>
          </div>
          <div className="relative mx-auto w-full aspect-[3/4] bg-gradient-to-br from-card to-accent/20 rounded shadow-lg border border-primary/20 overflow-hidden">
            <div className="h-4 bg-gradient-to-r from-primary to-[hsl(262_45%_42%)]" />
            <div className="p-1.5 space-y-1">
              <div className="flex items-center gap-0.5">
                <div className="h-2 w-2 rounded bg-primary/30" />
                <div className="h-1 w-2/3 bg-foreground/40 rounded" />
                <BadgeCheck className="h-1.5 w-1.5 text-primary ml-auto" />
              </div>
              <div className="grid grid-cols-3 gap-0.5 mt-1">
                <div className="h-3 rounded bg-primary/10 border border-primary/20" />
                <div className="h-3 rounded bg-primary/10 border border-primary/20" />
                <div className="h-3 rounded bg-primary/10 border border-primary/20" />
              </div>
              <div className="h-4 rounded bg-success/10 border border-success/20 mt-1 flex items-center justify-center">
                <div className="h-0.5 w-1/2 bg-success/60 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-2 rounded bg-accent border border-border" />
                <div className="h-2 rounded bg-accent border border-border" />
              </div>
            </div>
            <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-success text-white text-[7px] font-bold inline-flex items-center gap-0.5">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse" /> LIVE
            </div>
          </div>
          <p className="text-[8.5px] sm:text-[9px] text-foreground font-medium mt-2 leading-tight">
            One link. Always current. Branded, verified, trackable.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
        <FileText className="h-3 w-3" />
        <span className="line-through">facility-one-pager.pdf</span>
        <ArrowRight className="h-3 w-3 text-primary" />
        <Link2 className="h-3 w-3 text-primary" />
        <span className="font-mono text-primary font-semibold">centerlinked.com/p/...</span>
      </div>
    </div>
  );
}

// ============= Step 2: Build Your Page =============

function BuilderMock() {
  return (
    <BrowserFrame url="app.centerlinked.com/facility/horizon-malibu/edit">
      <div className="bg-background p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Editing</p>
            <p className="text-[11px] sm:text-[12px] font-bold text-foreground truncate">Horizon Recovery — Malibu</p>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-success/10 text-success text-[8.5px] font-bold border border-success/20 inline-flex items-center gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5" /> Saved
          </span>
        </div>

        <div className="space-y-1.5">
          {/* Hero image */}
          <div className="rounded-lg overflow-hidden border border-border">
            <div className="h-12 sm:h-14 bg-gradient-to-r from-primary/30 via-primary/20 to-[hsl(262_45%_42%)]/30 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)] opacity-20" />
              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-card/90 backdrop-blur text-[8px] font-semibold text-foreground border border-border">
                Cover photo
              </span>
            </div>
          </div>

          {/* Field rows */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-md border border-border bg-card">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Levels of Care</p>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {["Detox", "Res", "PHP", "IOP"].map((l) => (
                  <span key={l} className="px-1 py-0 rounded text-[8.5px] font-medium bg-accent text-accent-foreground">{l}</span>
                ))}
              </div>
            </div>
            <div className="p-1.5 rounded-md border border-border bg-card">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Beds</p>
              <p className="text-[11px] font-bold text-foreground leading-tight mt-0.5">62 <span className="text-[8.5px] font-medium text-success">• 4 open</span></p>
            </div>
          </div>

          <div className="p-1.5 rounded-md border border-border bg-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">In-Network Insurance</p>
              <span className="text-[8px] text-primary font-bold">+ Add</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["Aetna", "Blue Shield CA", "Cigna", "UnitedHealth", "Anthem", "Magellan"].map((i) => (
                <div key={i} className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-border bg-muted/40">
                  <BadgeCheck className="h-2 w-2 text-success shrink-0" />
                  <span className="text-[8.5px] font-semibold text-foreground truncate">{i}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-1.5 rounded-md border border-border bg-card">
            <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Specialty Programs</p>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {["Trauma", "Co-occurring", "MAT", "Adolescent", "LGBTQ+"].map((l) => (
                <span key={l} className="px-1 py-0.5 rounded text-[8.5px] font-medium bg-primary/10 text-primary border border-primary/20">{l}</span>
              ))}
            </div>
          </div>

          <button className="w-full py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center gap-1 shadow-sm">
            <Globe className="h-3 w-3" /> Publish to shareable link
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ============= Step 3: Share Anywhere =============

function ShareMock() {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-border bg-card">
      <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/5 via-card to-[hsl(262_45%_42%)]/5">
        <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Your shareable link</p>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-card border-2 border-primary/30 shadow-sm">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="flex-1 font-mono text-[10px] sm:text-[11px] text-foreground font-semibold truncate">
            centerlinked.com/p/horizon-malibu
          </span>
          <button className="px-2 py-1 rounded bg-primary text-primary-foreground text-[9px] font-bold inline-flex items-center gap-1 shrink-0">
            <Copy className="h-2.5 w-2.5" /> Copy
          </button>
        </div>

        <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mt-3 mb-1.5">Send it anywhere</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { icon: MessageSquare, label: "Text", color: "from-emerald-500 to-teal-600" },
            { icon: Mail, label: "Email", color: "from-blue-500 to-indigo-600" },
            { icon: Smartphone, label: "DM", color: "from-rose-500 to-pink-600" },
            { icon: Share2, label: "Anywhere", color: "from-amber-500 to-orange-600" },
          ].map((m) => (
            <div key={m.label} className="p-1.5 rounded-lg border border-border bg-card flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-sm`}>
                <m.icon className="h-3 w-3" />
              </div>
              <span className="text-[8.5px] font-semibold text-foreground">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Text message preview */}
        <div className="mt-3 max-w-[260px]">
          <div className="rounded-2xl rounded-bl-sm bg-muted px-2.5 py-2 shadow-sm">
            <p className="text-[10px] text-foreground leading-snug">
              Hey — here's our Malibu program. Live insurance + bed counts:
            </p>
            <div className="mt-1.5 rounded-md border border-border bg-card overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-[hsl(262_45%_42%)]" />
              <div className="p-1.5 flex items-center gap-1.5">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-primary/20 to-[hsl(262_45%_42%)]/20 flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-foreground truncate">Horizon Recovery — Malibu</p>
                  <p className="text-[7.5px] text-muted-foreground truncate">centerlinked.com</p>
                </div>
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground mt-1">10:24 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= Step 4: Recipient View (always live) =============

function RecipientViewMock() {
  return (
    <BrowserFrame>
      <div className="bg-card">
        <div className="h-14 sm:h-16 bg-gradient-to-r from-primary via-primary/90 to-[hsl(262_45%_42%)] relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,white_0%,transparent_60%)] opacity-15" />
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[8.5px] font-bold text-white border border-white/30 inline-flex items-center gap-1">
            <RefreshCw className="h-2 w-2" /> Updated 2 min ago
          </span>
        </div>
        <div className="px-3 pb-3 -mt-7">
          <div className="flex items-end gap-2">
            <div className="h-14 w-14 rounded-xl bg-card border-[3px] border-card shadow-lg flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="font-heading font-bold text-foreground text-[12px] sm:text-sm truncate">Horizon Recovery — Malibu</h4>
                <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              </div>
              <p className="text-[9.5px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> Malibu, CA
              </p>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1">
            {[
              { v: "62", l: "Beds" },
              { v: "4 open", l: "Avail", live: true },
              { v: "4.9", l: "Rating", star: true },
            ].map((s) => (
              <div key={s.l} className="py-1 rounded-md bg-muted/40 border border-border text-center">
                <p className={`text-[11px] font-bold flex items-center justify-center gap-0.5 ${s.live ? "text-success" : "text-foreground"}`}>
                  {s.star && <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />}
                  {s.v}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-2.5">
            <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Levels of Care</p>
            <div className="flex flex-wrap gap-0.5">
              {["Detox", "Residential", "PHP", "IOP"].map((l) => (
                <span key={l} className="px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-accent text-accent-foreground">{l}</span>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground">In-Network</p>
              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-success">
                <span className="h-1 w-1 rounded-full bg-success animate-pulse" /> Live
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["Aetna", "Blue Shield CA", "Cigna", "UnitedHealth", "Anthem", "Magellan"].map((i) => (
                <div key={i} className="flex items-center gap-0.5 px-1 py-1 rounded border border-border bg-card shadow-sm">
                  <BadgeCheck className="h-2 w-2 text-success shrink-0" />
                  <span className="text-[8.5px] font-semibold text-foreground truncate">{i}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <button className="py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center gap-1 shadow-sm">
              <Phone className="h-2.5 w-2.5" /> Call admissions
            </button>
            <button className="py-1.5 rounded-md border border-border bg-card text-[10px] font-bold text-foreground inline-flex items-center justify-center gap-1">
              <Send className="h-2.5 w-2.5" /> Send referral
            </button>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ============= Step 5: Engagement / Tracking =============

function InsightsMock() {
  const days = [22, 34, 28, 45, 38, 56, 48, 62, 58, 74, 68, 82];
  return (
    <BrowserFrame url="app.centerlinked.com/insights">
      <div className="p-2.5 sm:p-3 bg-background space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-[12px] font-heading font-bold text-foreground truncate">Link Activity</h4>
            <p className="text-[9px] text-muted-foreground">Horizon Malibu • Last 30 days</p>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold shrink-0">30D ▾</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Views", value: "284", trend: "+42%", icon: Eye },
            { label: "Shares", value: "37", trend: "+18%", icon: Share2 },
            { label: "Referrals", value: "11", trend: "+24%", icon: Send },
          ].map((s) => (
            <div key={s.label} className="p-1.5 sm:p-2 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <s.icon className="h-2.5 w-2.5" />
                <p className="text-[8px] uppercase tracking-wide font-bold">{s.label}</p>
              </div>
              <p className="text-[14px] sm:text-base font-heading font-bold text-foreground mt-0.5 leading-none">{s.value}</p>
              <p className="text-[8.5px] text-success font-bold mt-0.5">↑ {s.trend}</p>
            </div>
          ))}
        </div>

        <div className="p-2 rounded-lg bg-card border border-border">
          <p className="text-[9.5px] font-bold text-foreground mb-1.5">Page Views — Last 12 Days</p>
          <div className="flex items-end gap-0.5 h-12 sm:h-14">
            {days.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border">
          <p className="text-[9.5px] font-bold text-foreground mb-1">Recent Viewers</p>
          <div className="space-y-1">
            {[
              { n: "Sarah Chen", o: "Pacific Wellness", t: "12m ago", c: "from-blue-500 to-indigo-600", i: "SC" },
              { n: "Marcus Rivera", o: "Summit Treatment", t: "1h ago", c: "from-emerald-500 to-teal-600", i: "MR" },
              { n: "Jordan Patel", o: "Cedar Recovery", t: "3h ago", c: "from-amber-500 to-orange-600", i: "JP" },
            ].map((p) => (
              <div key={p.n} className="flex items-center gap-1.5">
                <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${p.c} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>{p.i}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-semibold text-foreground truncate leading-tight">{p.n}</p>
                  <p className="text-[8px] text-muted-foreground truncate">{p.o}</p>
                </div>
                <p className="text-[8.5px] text-muted-foreground shrink-0">{p.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ============= Step 6: Ready =============

function ReadyMock() {
  return (
    <BrowserFrame>
      <div className="relative bg-gradient-to-br from-primary via-primary to-[hsl(262_45%_42%)] text-primary-foreground p-4 sm:p-6 overflow-hidden">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[9.5px] font-bold">
            <Sparkles className="h-3 w-3" /> FOUNDING MEMBER ACCESS
          </div>
          <h3 className="mt-2.5 text-base sm:text-lg font-heading font-bold leading-tight">
            Retire the PDF. Claim your<br />shareable facility link.
          </h3>
          <ul className="mt-3 space-y-1">
            {[
              "Lifetime founding-member pricing",
              "Priority verification within 24 hours",
              "Custom branded link & analytics",
              "Direct input on the roadmap",
            ].map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-[11px] sm:text-[12px]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600"].map((c, i) => (
                <div key={i} className={`h-5 w-5 rounded-full bg-gradient-to-br ${c} border-2 border-primary`} />
              ))}
            </div>
            <p className="text-[10px] font-semibold">
              <span className="font-bold">240+ BD reps</span> already on the waitlist
            </p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ============= Steps =============

const steps: Step[] = [
  {
    id: "problem",
    eyebrow: "The shift",
    title: "Replace the PDF one-pager with a living link",
    description:
      "BD reps still email PDF facility sheets that go stale the moment they're sent. CenterLinked gives every facility one branded link that's always current — insurance, beds, programs, contact — and verified.",
    icon: FileText,
    visual: <ProblemMock />,
    benefits: [
      "No more chasing outdated attachments",
      "One source of truth for every facility",
      "Verified badge means recipients trust what they see",
    ],
  },
  {
    id: "build",
    eyebrow: "Step 1",
    title: "Build your facility page in minutes",
    description:
      "Add your levels of care, in-network insurance, bed count, specialty programs, photos, and admissions contact. Update once — it's reflected everywhere your link lives.",
    icon: Building2,
    visual: <BuilderMock />,
    benefits: [
      "Pre-loaded insurance list — no typing payer names",
      "Live bed availability you control",
      "Branded cover photo and verified badge",
    ],
  },
  {
    id: "share",
    eyebrow: "Step 2",
    title: "Share one link — text, email, anywhere",
    description:
      "Copy your facility link and drop it into a text, email, DM, or signature. Rich link previews render automatically so recipients see the page before they even click.",
    icon: Link2,
    visual: <ShareMock />,
    benefits: [
      "Works in any text or email app",
      "Auto-generated rich previews",
      "No app install needed for the recipient",
    ],
  },
  {
    id: "recipient",
    eyebrow: "Step 3",
    title: "Recipients see a live, mobile-ready page",
    description:
      "When someone opens your link, they get a clean mobile-first facility page with current insurance, open beds, and one-tap admissions contact — no PDF zooming, no stale info.",
    icon: Smartphone,
    visual: <RecipientViewMock />,
    benefits: [
      "Always up to date — edits push instantly",
      "Call admissions or send a referral in one tap",
      "Looks great on any phone, tablet, or desktop",
    ],
  },
  {
    id: "insights",
    eyebrow: "Step 4",
    title: "See who's viewing and what's working",
    description:
      "Track views, shares, and referrals on every link. Know which contacts opened your page, when, and how often — turn BD into a measurable channel instead of a guess.",
    icon: TrendingUp,
    visual: <InsightsMock />,
    benefits: [
      "Real-time view and share counts",
      "Identify your most engaged partners",
      "Report BD impact with real numbers",
    ],
  },
  {
    id: "ready",
    eyebrow: "You're ready",
    title: "Claim your facility's link",
    description:
      "We're onboarding founding facilities now. Lock in founding-member pricing and get your verified, branded facility link live in under 48 hours.",
    icon: CheckCircle2,
    visual: <ReadyMock />,
    benefits: [],
  },
];

interface WalkthroughDialogProps {
  children: ReactNode;
}

export function WalkthroughDialog({ children }: WalkthroughDialogProps) {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const safeIdx = Math.min(Math.max(stepIdx, 0), steps.length - 1);
  const step = steps[safeIdx];
  const isLast = safeIdx === steps.length - 1;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setTimeout(() => setStepIdx(0), 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-5xl p-0 gap-0 overflow-hidden border-border h-[94vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-muted shrink-0">
          <div
            className="h-full bg-gradient-to-r from-primary to-[hsl(262_45%_42%)] transition-all duration-500 ease-out"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* MOBILE LAYOUT */}
        <div className="flex flex-col flex-1 min-h-0 md:hidden">
          <div className="relative flex-1 min-h-0 bg-gradient-to-br from-accent/40 via-background to-accent/20 overflow-y-auto px-3 pt-10 pb-4">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[hsl(262_45%_42%)]/10 blur-3xl pointer-events-none" />
            <div key={step.id + "-m"} className="relative w-full max-w-[360px] mx-auto animate-fade-up">
              {step.visual}
            </div>
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm z-10">
              <step.icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {step.eyebrow}
              </span>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-4 pt-3 pb-3 flex flex-col gap-2.5">
            <div key={step.id + "-mt"} className="animate-fade-up">
              <h2 className="font-heading text-[15px] font-extrabold text-foreground leading-tight">
                {step.title}
              </h2>
              <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed line-clamp-3">
                {step.description}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStepIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIdx ? "w-6 bg-primary" : i < stepIdx ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
              <span className="ml-auto text-[10px] text-muted-foreground font-semibold">
                {stepIdx + 1} / {steps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                disabled={stepIdx === 0}
                size="sm"
                className="px-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isLast ? (
                <EarlyAccessDialog>
                  <Button variant="hero" size="sm" className="flex-1 group">
                    Get Early Access
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </EarlyAccessDialog>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                  className="flex-1 group"
                >
                  Next
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden md:grid md:grid-cols-2 flex-1 min-h-0 overflow-hidden">
          <div className="p-8 lg:p-10 flex flex-col min-w-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(262_45%_42%)] text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {step.eyebrow}
              </span>
            </div>

            <h2 className="font-heading text-2xl lg:text-3xl font-extrabold text-foreground leading-tight">
              {step.title}
            </h2>
            <p className="mt-3 text-sm lg:text-base text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {step.benefits.length > 0 && (
              <ul className="mt-4 space-y-2">
                {step.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex-1 min-h-4" />

            <div className="mt-6 flex items-center gap-1.5 flex-wrap">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStepIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIdx ? "w-8 bg-primary" : i < stepIdx ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
              <span className="ml-auto text-xs text-muted-foreground font-medium">
                {stepIdx + 1} / {steps.length}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                disabled={stepIdx === 0}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {isLast ? (
                <EarlyAccessDialog>
                  <Button variant="hero" className="flex-1 group">
                    Get Early Access
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </EarlyAccessDialog>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                  className="flex-1 group"
                >
                  Next
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              )}
            </div>
          </div>

          {/* Visual */}
          <div className="relative bg-gradient-to-br from-accent/40 via-background to-accent/20 p-6 lg:p-8 flex items-center justify-center border-l border-border overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[hsl(262_45%_42%)]/10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div key={step.id + "-d"} className="relative w-full max-w-md animate-fade-up">
              {step.visual}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
