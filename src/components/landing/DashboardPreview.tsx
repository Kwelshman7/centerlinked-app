import {
  Bell,
  CheckCircle2,
  Users,
  TrendingUp,
  Phone,
  MessageSquare,
  Share2,
  ArrowUpRight,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

const partners = [
  { initials: "SR", name: "Sarah Reyes", org: "Sunrise Recovery", color: "from-blue-500 to-indigo-600", status: "active" },
  { initials: "MT", name: "Marcus Thompson", org: "Coastal Health", color: "from-emerald-500 to-teal-600", status: "active" },
  { initials: "JL", name: "Jordan Lee", org: "Horizon Behavioral", color: "from-amber-500 to-orange-600", status: "new" },
  { initials: "AK", name: "Amara Khan", org: "Beacon Wellness", color: "from-rose-500 to-pink-600", status: "active" },
];

const activity = [
  { who: "Sarah R.", action: "verified 3 contracts", time: "12m", icon: CheckCircle2, tone: "text-success" },
  { who: "You", action: "shared Sunrise PHP with Marcus", time: "1h", icon: Share2, tone: "text-primary" },
  { who: "Jordan L.", action: "joined your network", time: "3h", icon: Sparkles, tone: "text-amber-600" },
];

interface Props {
  variant?: "desktop" | "mobile";
}

export function DashboardPreview({ variant = "mobile" }: Props) {
  void variant;

  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px] lg:w-[340px]" style={{ aspectRatio: "393 / 852" }}>
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-foreground via-foreground/95 to-foreground shadow-2xl p-[6px]">
        <div className="relative h-full w-full rounded-[2.7rem] bg-foreground p-[3px]">
          <span className="absolute -left-[7px] top-[110px] h-7 w-[3px] rounded-l bg-foreground/80" />
          <span className="absolute -left-[7px] top-[150px] h-12 w-[3px] rounded-l bg-foreground/80" />
          <span className="absolute -left-[7px] top-[210px] h-12 w-[3px] rounded-l bg-foreground/80" />
          <span className="absolute -right-[7px] top-[170px] h-16 w-[3px] rounded-r bg-foreground/80" />

          <div className="relative h-full w-full rounded-[2.55rem] overflow-hidden bg-background">
            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 h-9 flex items-center justify-between px-6 z-30 text-foreground">
              <span className="text-[10px] font-semibold tracking-tight">9:41</span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="font-semibold">●●●●</span>
                <span className="font-semibold">5G</span>
              </span>
            </div>

            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-[26px] w-[95px] rounded-full bg-foreground z-40 flex items-center justify-end pr-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-blink" />
            </div>

            <div className="absolute inset-0 pt-9 flex flex-col bg-background">
              {/* Gradient hero header */}
              <div className="relative px-4 pt-3 pb-5 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-md px-1.5 py-1">
                    <img
                      src={centerlinkedLogo}
                      alt="CenterLinked"
                      className="h-3 w-auto object-contain brightness-0 invert"
                      draggable={false}
                    />
                  </div>
                  <button className="relative h-7 w-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Bell className="h-3 w-3" />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-300 animate-blink" />
                  </button>
                </div>

                <div className="relative mt-3">
                  <p className="text-[9.5px] font-medium opacity-80">Good morning, Alex</p>
                  <h2 className="text-[17px] font-bold font-heading leading-tight mt-0.5">
                    Your network is <br />growing.
                  </h2>
                </div>

                {/* Stats row */}
                <div className="relative mt-3 grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 p-1.5">
                    <p className="text-[8px] opacity-80 font-medium">Connections</p>
                    <p className="text-[14px] font-bold leading-none mt-0.5">128</p>
                    <p className="text-[7.5px] flex items-center gap-0.5 mt-0.5 opacity-90">
                      <TrendingUp className="h-2 w-2" /> +12 wk
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 p-1.5">
                    <p className="text-[8px] opacity-80 font-medium">Shares</p>
                    <p className="text-[14px] font-bold leading-none mt-0.5">47</p>
                    <p className="text-[7.5px] flex items-center gap-0.5 mt-0.5 opacity-90">
                      <TrendingUp className="h-2 w-2" /> +8 wk
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 p-1.5">
                    <p className="text-[8px] opacity-80 font-medium">Verified</p>
                    <p className="text-[14px] font-bold leading-none mt-0.5">100%</p>
                    <p className="text-[7.5px] flex items-center gap-0.5 mt-0.5 opacity-90">
                      <CheckCircle2 className="h-2 w-2" /> Current
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-3.5 pt-3 pb-3 space-y-3 overflow-hidden -mt-2">
                {/* Network card */}
                <div className="rounded-2xl bg-card border border-border shadow-sm p-3 animate-pop-in" style={{ animationDelay: "120ms" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold text-foreground">Your BD network</span>
                    </div>
                    <button className="text-[8.5px] font-semibold text-primary inline-flex items-center gap-0.5">
                      View all <ArrowUpRight className="h-2 w-2" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {partners.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-2 animate-pop-in" style={{ animationDelay: `${160 + i * 60}ms` }}>
                        <div className={`relative h-7 w-7 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                          {p.initials}
                          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border border-card" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-foreground truncate leading-tight">{p.name}</p>
                          <p className="text-[8.5px] text-muted-foreground truncate leading-tight">{p.org}</p>
                        </div>
                        {p.status === "new" ? (
                          <span className="text-[7.5px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">NEW</span>
                        ) : (
                          <div className="flex gap-0.5">
                            <button className="h-5 w-5 rounded-md bg-muted flex items-center justify-center">
                              <MessageSquare className="h-2.5 w-2.5 text-foreground" />
                            </button>
                            <button className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                              <Phone className="h-2.5 w-2.5 text-primary" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity feed */}
                <div className="rounded-2xl bg-card border border-border shadow-sm p-3 animate-pop-in" style={{ animationDelay: "320ms" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold text-foreground">Today</span>
                    </div>
                    <span className="text-[8.5px] text-muted-foreground font-medium">Live</span>
                  </div>
                  <div className="space-y-1.5">
                    {activity.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 ${a.tone}`}>
                            <Icon className="h-2.5 w-2.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9.5px] text-foreground leading-tight">
                              <span className="font-bold">{a.who}</span>{" "}
                              <span className="text-muted-foreground">{a.action}</span>
                            </p>
                            <p className="text-[8px] text-muted-foreground mt-0.5">{a.time} ago</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* My program quick action */}
                <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/85 text-background p-3 animate-pop-in shadow-lg" style={{ animationDelay: "480ms" }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Building2 className="h-2.5 w-2.5 opacity-70" />
                        <p className="text-[8px] uppercase tracking-wider opacity-70 font-semibold">My program</p>
                      </div>
                      <p className="text-[11px] font-bold leading-tight">Sunrise Detox of Boca</p>
                      <p className="text-[8.5px] opacity-70 mt-0.5">Last shared 14 times this week</p>
                    </div>
                    <button className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-[9.5px] font-bold flex items-center gap-1 shrink-0 shadow-md">
                      <Share2 className="h-2.5 w-2.5" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-foreground/70 z-40" />
          </div>
        </div>
      </div>

      <div className="absolute -inset-8 -z-10 bg-primary/10 blur-3xl rounded-full opacity-60" />
    </div>
  );
}
