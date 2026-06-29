import { Sparkles } from "lucide-react";

export interface WhyReferItem {
  title: string;
  body: string;
}

interface Props {
  orgName: string;
  items: WhyReferItem[];
}

export function WhyReferSection({ orgName, items }: Props) {
  const list = items.length > 0 ? items.slice(0, 4) : defaultWhyRefer();

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="font-heading text-lg sm:text-xl font-bold">Why refer to {orgName}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-muted/30 p-4 hover:border-primary/30 transition-colors"
          >
            <div className="font-heading font-semibold text-sm">{it.title}</div>
            <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function defaultWhyRefer(): WhyReferItem[] {
  return [
    { title: "Multiple Programs", body: "More than one location supports different levels of care and clinical needs." },
    { title: "Clear Specialization", body: "Each facility has a defined treatment focus so referrals land in the right place." },
    { title: "Easy Matching", body: "Quickly compare location, level of care, focus, and insurance fit in one view." },
    { title: "Direct Communication", body: "Identify the right BD contact for admissions, availability, and insurance questions." },
  ];
}
