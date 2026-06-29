import { Building2, Layers, Heart, ShieldCheck } from "lucide-react";

interface Props {
  facilityCount: number;
  levelsOfCare: string[];
  focusAreas: string[];
  insuranceSummary: string;
}

export function OrgSnapshotCards({ facilityCount, levelsOfCare, focusAreas, insuranceSummary }: Props) {
  const cards = [
    {
      icon: Building2,
      value: `${facilityCount} ${facilityCount === 1 ? "Facility" : "Facilities"}`,
      label: "Programs in network",
    },
    {
      icon: Layers,
      value: levelsOfCare.length ? levelsOfCare.slice(0, 4).join(", ") : "Multiple",
      label: "Levels of care",
    },
    {
      icon: Heart,
      value: focusAreas.length ? focusAreas.slice(0, 3).join(", ") : "Behavioral Health",
      label: "Primary focus",
    },
    {
      icon: ShieldCheck,
      value: insuranceSummary || "Verification Required",
      label: "Insurance overview",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all min-w-0"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
            <c.icon className="h-4 w-4" />
          </div>
          <div className="text-sm sm:text-base font-heading font-bold leading-snug line-clamp-2">{c.value}</div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
