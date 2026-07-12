import { FileText, Mail, Link2, RefreshCw } from "lucide-react";

const problems = [
  {
    icon: FileText,
    title: "PDFs go stale overnight",
    body: "Partners save last quarter's one-pager. Insurance and contacts change — they never see it.",
  },
  {
    icon: Mail,
    title: "Mass emails get ignored",
    body: "Update blasts land once, then disappear. Nobody searches their inbox for your latest LOC list.",
  },
  {
    icon: Link2,
    title: "One link stays current",
    body: "Share once. When you update the profile, every partner sees the right info — without another email.",
  },
  {
    icon: RefreshCw,
    title: "Referrals shouldn't wait on you",
    body: "Discharge planners need answers now. A live link beats phone tag and outdated attachments.",
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
            Partners look at your PDF once.{" "}
            <span className="text-primary">Then never again.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stale info loses placements. CenterLinked fixes that with one link you keep current.
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
