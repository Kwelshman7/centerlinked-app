import { FileText, UserX, PhoneOff, ShieldAlert } from "lucide-react";

const problems = [
  {
    icon: FileText,
    title: "The one-pager they saved is outdated",
    body: "You emailed a PDF last quarter. Since then, insurance panels shifted and a new program opened. Partners still open the old file.",
  },
  {
    icon: UserX,
    title: "Your BD rep left — their number didn't",
    body: "Turnover happens. The contact on last year's leave-behind still gets called. Referrals bounce, or never land.",
  },
  {
    icon: PhoneOff,
    title: "Mass update emails disappear",
    body: "Discharge planners don't dig through inbox history for your latest LOC list. If the answer isn't one click away, they move on.",
  },
  {
    icon: ShieldAlert,
    title: "\"We take most insurance\" isn't enough",
    body: "Partners need named payers they can act on. Vague claims force another phone call — and another chance to lose the placement.",
  },
];

export function Problem() {
  return (
    <section className="bg-background py-14 sm:py-16 lg:py-24">
      <div className="container max-w-6xl">
        <div className="text-center mb-10 sm:mb-12 px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            The Problem
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Referral information changes.{" "}
            <span className="text-primary">PDFs don't.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Behavioral health BD teams work hard to stay top of mind — then lose placements
            because partners are working from outdated materials. None of this is anyone's fault.
            The tools just weren't built for how referrals actually happen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {problems.map((p) => (
            <div
              key={p.title}
              className="group flex gap-4 p-5 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-bold text-foreground tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
