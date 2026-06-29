import { SearchResultsPreview } from "./SearchResultsPreview";
import { Search, Filter, BadgeCheck } from "lucide-react";

const highlights = [
  {
    icon: Search,
    title: "Searchable by what actually matters",
    description:
      "Level of care, location, payer fit, and program specialties — the filters BD reps and case managers reach for first.",
  },
  {
    icon: Filter,
    title: "Surface the right partner faster",
    description:
      "When a client isn't a fit for your program, find a trusted organization with the right LOC and in-network insurance in seconds.",
  },
  {
    icon: BadgeCheck,
    title: "Verified organizations only",
    description:
      "Every profile in the network is tied to a real organization with verified BD contacts — not anonymous listings.",
  },
];

export function SearchableNetwork() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Phone mockup */}
          <div className="relative flex justify-center order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-60" />
              <SearchResultsPreview />
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-7 order-1 lg:order-2">
            <div className="space-y-5">
              <span className="inline-block px-4 py-1.5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
                Searchable referral network
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                A live directory your team can{" "}
                <span className="text-primary">actually search</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                As more organizations join, your profile becomes discoverable to referral partners searching by payer, location, and level of care — on top of the relationships you've already built.
              </p>
            </div>

            <ul className="space-y-5">
              {highlights.map((h) => (
                <li key={h.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <h.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      {h.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
