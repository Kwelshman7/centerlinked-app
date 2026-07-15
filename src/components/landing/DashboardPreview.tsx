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

export function DashboardPreviewContent() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative px-4 pt-3 pb-5 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden shrink-0">
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
          <button type="button" className="relative h-7 w-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Bell className="h-3 w-3" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
          </button>
        </div>

        <div className="relative mt-3">
          <p className="text-[9.5px] font-medium opacity-80">Good morning, Alex</p>
          <h2 className="text-[17px] font-bold font-heading leading-tight mt-0.5">
            Your network is <br />growing.
          </h2>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          {[
            { label: "Connections", value: "128", sub: "+12 wk" },
            { label: "Shares", value: "47", sub: "+8 wk" },
            { label: "Verified", value: "100%", sub: "Current" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 p-1.5">
              <p className="text-[8px] opacity-80 font-medium">{stat.label}</p>
              <p className="text-[14px] font-bold leading-none mt-0.5">{stat.value}</p>
              <p className="text-[7.5px] flex items-center gap-0.5 mt-0.5 opacity-90">
                <TrendingUp className="h-2 w-2" /> {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-3.5 pt-3 pb-3 space-y-3 overflow-hidden -mt-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-foreground">Your BD network</span>
            </div>
            <span className="text-[8.5px] font-semibold text-primary inline-flex items-center gap-0.5">
              View all <ArrowUpRight className="h-2 w-2" />
            </span>
          </div>
          <div className="space-y-1.5">
            {partners.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
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
                    <button type="button" className="h-5 w-5 rounded-md bg-muted flex items-center justify-center">
                      <MessageSquare className="h-2.5 w-2.5 text-foreground" />
                    </button>
                    <button type="button" className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                      <Phone className="h-2.5 w-2.5 text-primary" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-3">
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

        <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/85 text-background p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <Building2 className="h-2.5 w-2.5 opacity-70" />
                <p className="text-[8px] uppercase tracking-wider opacity-70 font-semibold">My program</p>
              </div>
              <p className="text-[11px] font-bold leading-tight">Sunrise Detox of Boca</p>
              <p className="text-[8.5px] opacity-70 mt-0.5">Shared 14 times this week</p>
            </div>
            <button type="button" className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-[9.5px] font-bold flex items-center gap-1 shrink-0 shadow-md">
              <Share2 className="h-2.5 w-2.5" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
