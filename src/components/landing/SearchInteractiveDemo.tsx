/**
 * Animated mobile search demo for ProductShowcase.
 * Types Aetna → selects Florida → shows Banyan results.
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Search as SearchIcon,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  LayoutDashboard,
  Building2,
  Settings,
  Check,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { BANYAN_DEMO, BANYAN_GRID_FACILITIES } from "./banyanDemoData";

const PAYER = "Aetna";
const STATE_LABEL = "Florida";
const STATE_CODE = "FL";

const FL_MATCHES = BANYAN_GRID_FACILITIES.filter((f) => f.state === "FL").slice(0, 3);

const BANYAN_RESULT = {
  org_name: BANYAN_DEMO.orgName,
  hq: BANYAN_DEMO.hqLabel,
  logo: BANYAN_DEMO.logo,
  facilities: FL_MATCHES.map((f) => ({
    name: f.name,
    place: [f.city, f.state].filter(Boolean).join(", "),
    level: f.levels_of_care?.[0] ?? "Residential",
    payer: PAYER,
  })),
};

const TOTAL_ORGS = 3;
const TOTAL_FACILITIES = BANYAN_RESULT.facilities.length + 2;

const TABS = [
  { label: "Home", icon: LayoutDashboard, active: false },
  { label: "Search", icon: SearchIcon, active: true },
  { label: "Network", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

const STATE_OPTIONS = ["Any state", "California", "Florida", "Texas"] as const;

type Phase =
  | "idle"
  | "typing"
  | "payerDone"
  | "stateOpen"
  | "statePick"
  | "filled"
  | "clicking"
  | "results"
  | "hold";

function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-muted/30 text-foreground select-none pointer-events-none">
      <header className="shrink-0 z-20 bg-card/85 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="w-9 shrink-0" />
          <Logo to="/app" size="sm" className="pointer-events-none" />
          <div className="w-9 shrink-0" />
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      <nav className="absolute inset-x-0 bottom-0 z-30 bg-card/90 backdrop-blur-xl border-t border-border/60">
        <ul className="grid grid-cols-4 h-16">
          {TABS.map(({ label, icon: Icon, active }) => (
            <li key={label}>
              <div
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden />
                <span className="leading-none">{label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function SearchFormScreen({
  payerText,
  stateLabel,
  stateOpen,
  stateHighlight,
  searchPressed,
  caretOn,
}: {
  payerText: string;
  stateLabel: string | null;
  stateOpen: boolean;
  stateHighlight: boolean;
  searchPressed: boolean;
  caretOn: boolean;
}) {
  return (
    <div className="h-full overflow-hidden px-4 py-5 space-y-6 pb-20">
      <div className="text-center space-y-2 pt-1">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Find in-network facilities
        </h1>
        <p className="text-sm text-muted-foreground">
          Search verified treatment contracts by insurance, location, and level of care.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1.5" data-demo-payer>
          <label className="text-sm font-medium">Insurance</label>
          <div
            className={cn(
              "h-10 rounded-md border bg-background px-3 flex items-center justify-between gap-2 min-w-0 transition-shadow",
              caretOn
                ? "border-primary ring-2 ring-primary/20"
                : "border-input",
            )}
          >
            <span
              className={cn(
                "text-sm truncate",
                payerText ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {payerText || "Any insurance"}
              {caretOn && (
                <span className="inline-block w-[1.5px] h-4 ml-0.5 align-middle bg-foreground animate-pulse" />
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="space-y-1.5 min-w-0 relative" data-demo-state>
            <label className="text-sm font-medium">State</label>
            <div
              className={cn(
                "h-10 rounded-md border bg-background px-3 flex items-center justify-between gap-2 min-w-0 transition-shadow",
                stateOpen || stateHighlight
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-input",
              )}
            >
              <span
                className={cn(
                  "text-sm truncate",
                  stateLabel ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {stateLabel || "Any state"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            </div>

            {stateOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-md border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {STATE_OPTIONS.map((opt) => {
                  const active = opt === STATE_LABEL;
                  return (
                    <div
                      key={opt}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground",
                      )}
                    >
                      <span>{opt}</span>
                      {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <label className="text-sm font-medium">City</label>
            <div className="h-10 rounded-md border border-input bg-background px-3 flex items-center min-w-0">
              <span className="text-sm text-muted-foreground truncate">Any city</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Level of care</label>
          <div className="h-10 rounded-md border border-input bg-background px-3 flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm text-muted-foreground truncate">Any level of care</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
        </div>

        <div
          data-demo-search
          className={cn(
            "h-11 w-full rounded-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-transform",
            searchPressed
              ? "bg-primary/90 text-primary-foreground scale-[0.98]"
              : "bg-primary text-primary-foreground",
          )}
        >
          <SearchIcon className="h-4 w-4 shrink-0" aria-hidden />
          Search facilities
        </div>
      </div>
    </div>
  );
}

function ResultsScreen() {
  return (
    <div className="h-full overflow-hidden px-4 py-5 space-y-4 pb-20 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium text-muted-foreground">
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          New search
        </div>
        <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background text-sm font-medium">
          <SearchIcon className="h-4 w-4 shrink-0" aria-hidden />
          Edit search
        </div>
      </div>

      <div className="min-w-0">
        <h1 className="text-lg font-semibold truncate leading-tight">
          {PAYER} · in {STATE_CODE}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {TOTAL_ORGS} organizations · {TOTAL_FACILITIES} matching facilities
        </p>
      </div>

      <div className="rounded-xl bg-card border border-primary/60 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-3 min-w-0">
          <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border border-border flex items-center justify-center p-2.5 shrink-0">
            <img
              src={BANYAN_RESULT.logo}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <h3 className="font-heading font-bold text-base leading-snug line-clamp-2 min-w-0 flex-1">
                {BANYAN_RESULT.org_name}
              </h3>
              <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 mt-0.5">
                <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                Preferred
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{BANYAN_RESULT.hq}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/80 font-semibold">
                <ShieldCheck className="h-3 w-3 text-success shrink-0" aria-hidden />
                {BANYAN_RESULT.facilities.length} matches
              </span>
              <span className="inline-flex items-center gap-1 text-primary font-semibold">
                <Users className="h-3 w-3 shrink-0" aria-hidden />
                In your network
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
            {BANYAN_RESULT.facilities.map((f) => (
              <li key={f.name}>
                <div className="flex items-center justify-between gap-3 px-3 py-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.place} · {f.level}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    {f.payer}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-3 pb-3">
          <div className="h-9 w-full rounded-md bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
            View organization page
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchInteractiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [payerText, setPayerText] = useState("");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) {
      setPhase("idle");
      setPayerText("");
      return;
    }

    if (reduceMotion) {
      setPhase("results");
      setPayerText(PAYER);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const run = async () => {
      while (!cancelled) {
        setPhase("idle");
        setPayerText("");
        await wait(900);

        setPhase("typing");
        for (let i = 1; i <= PAYER.length; i++) {
          if (cancelled) return;
          setPayerText(PAYER.slice(0, i));
          await wait(140);
        }

        setPhase("payerDone");
        await wait(700);

        setPhase("stateOpen");
        await wait(900);

        setPhase("statePick");
        await wait(1100);

        setPhase("filled");
        await wait(900);

        setPhase("clicking");
        await wait(450);

        setPhase("results");
        await wait(5200);

        setPhase("hold");
        await wait(1200);
      }
    };

    void run();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [inView, reduceMotion]);

  const showResults = phase === "results" || phase === "hold" || (reduceMotion && phase === "results");
  const stateLabel =
    phase === "statePick" ||
    phase === "filled" ||
    phase === "clicking" ||
    phase === "results" ||
    phase === "hold"
      ? STATE_LABEL
      : null;

  return (
    <div ref={rootRef} className="h-full min-h-0">
      <AppChrome>
        {showResults ? (
          <ResultsScreen />
        ) : (
          <SearchFormScreen
            payerText={payerText}
            stateLabel={stateLabel}
            stateOpen={phase === "stateOpen" || phase === "statePick"}
            stateHighlight={phase === "stateOpen" || phase === "statePick" || phase === "filled"}
            searchPressed={phase === "clicking"}
            caretOn={phase === "typing" || phase === "payerDone"}
          />
        )}
      </AppChrome>
    </div>
  );
}

/** Static end-state for reduced-motion / fallbacks. */
export function SearchResultsPreviewContent() {
  return (
    <AppChrome>
      <ResultsScreen />
    </AppChrome>
  );
}
