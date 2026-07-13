import { FileWarning, PhoneMissed, Clock3 } from "lucide-react";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";

const changePoints = [
  "Insurance contracts change",
  "New programs launch",
  "Additional locations open",
  "BD representatives change",
  "Admissions numbers update",
  "Specialty services expand",
];

const consequences = [
  {
    icon: FileWarning,
    title: "Stale materials",
    body: "Brochures and PDFs fall out of date within weeks.",
  },
  {
    icon: PhoneMissed,
    title: "Wasted calls",
    body: "Partners call the wrong number or chase outdated coverage.",
  },
  {
    icon: Clock3,
    title: "Delayed care",
    body: "Patients wait longer while teams chase accurate information.",
  },
];

export function Problem() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="space-y-6 max-w-xl">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              The problem
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              Referral information changes every day.{" "}
              <span className="text-primary">Marketing materials don't.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Behavioral health organizations invest heavily in referral relationships — yet most
              placements still depend on outdated brochures, PDFs, business cards, and email chains.
            </p>
            <p className="text-base text-foreground/85 leading-relaxed font-medium">
              When your programs, payers, or contacts change, partners often never hear about it.
            </p>

            <ul className="grid sm:grid-cols-2 gap-2.5 pt-2">
              {changePoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2.5 text-sm text-foreground/85"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[facility1, facility2, facility3].map((src, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-xl sm:rounded-2xl ${
                    i === 1 ? "mt-4 sm:mt-6" : i === 2 ? "mt-2 sm:mt-3" : ""
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 to-transparent" />
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              {consequences.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-3.5 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
