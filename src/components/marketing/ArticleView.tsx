import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { MarketingShell, useMarketingMeta } from "./MarketingChrome";
import { Reveal } from "./Reveal";
import type { MarketingArticle, Split } from "./site";

const trustPills = ["Work-email accounts", "In-network contracts", "Monthly verification", "No patient records"];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] focus-visible:ring-offset-2";

const focusRingOnDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54a89c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#003048]";

function eyebrowTone(path: string) {
  if (path.startsWith("/platform/")) {
    return {
      chip: "bg-[#9771e1]/20 text-[#d4c4f5] ring-1 ring-[#9771e1]/40",
      label: "text-[#c4b4f0]",
      accent: "text-[#9771e1]",
    };
  }
  if (path.includes("bd-reps") || path.includes("referral")) {
    return {
      chip: "bg-[#2088b8]/25 text-[#b8e0f0] ring-1 ring-[#2088b8]/50",
      label: "text-[#5ebbd4]",
      accent: "text-[#3ca8b4]",
    };
  }
  return {
    chip: "bg-[#54a89c]/20 text-[#b8e8dc] ring-1 ring-[#54a89c]/45",
    label: "text-[#54a89c]",
    accent: "text-[#3ca8b4]",
  };
}

function SecondBand({ article, split }: { article: MarketingArticle; split: Split }) {
  const layout = article.secondBand ?? "cards";

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">{split.eyebrow}</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#003048] sm:text-4xl">{split.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-[#3e5960]">{split.body}</p>
        </Reveal>

        {layout === "checklist" ? (
          <ul className="mt-10 max-w-2xl space-y-3">
            {split.points.map((point, index) => (
              <li key={point}>
                <Reveal delay={index * 50}>
                  <div className="flex gap-3 border-b border-[#d3e3ee] pb-3 last:border-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003048] text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <p className="min-w-0 text-base font-semibold leading-snug text-[#003048]">{point}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : null}

        {layout === "rail" ? (
          <ol className="mt-10 max-w-2xl min-w-0 space-y-0 border-l-2 border-[#2088b8]/40 pl-6 sm:pl-8">
            {split.points.map((point, index) => (
              <li key={point} className="relative pb-6 last:pb-0">
                <Reveal delay={index * 60}>
                  <span className="absolute -left-[1.6rem] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#2088b8] font-heading text-[10px] font-bold text-white sm:-left-[1.95rem]">
                    {index + 1}
                  </span>
                  <p className="min-w-0 pt-0.5 text-base font-semibold leading-snug text-[#003048]">{point}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        ) : null}

        {layout === "stripes" ? (
          <ul className="mt-10 divide-y divide-[#d3e3ee] overflow-hidden rounded-2xl border border-[#d3e3ee]">
            {split.points.map((point, index) => (
              <li key={point}>
                <Reveal delay={index * 50}>
                  <div className="flex gap-4 bg-white px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                    <span
                      className="w-1 shrink-0 rounded-full"
                      style={{
                        backgroundColor: ["#2088b8", "#3ca8b4", "#54a89c", "#9771e1"][index % 4],
                      }}
                      aria-hidden
                    />
                    <p className="min-w-0 text-base font-semibold leading-snug text-[#003048]">{point}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : null}

        {layout === "cards" ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {split.points.map((point, index) => (
              <Reveal key={point} delay={index * 50}>
                <article className="h-full border-l-4 border-[#2088b8] bg-[#f0f6fa] p-5 sm:p-6">
                  <p className="min-w-0 text-base font-semibold leading-snug text-[#003048]">{point}</p>
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ArticleView({ article }: { article: MarketingArticle }) {
  const [process, ...rest] = article.splits;
  const tone = eyebrowTone(article.path);
  const second = rest[0];
  const trailing = rest.slice(1);

  useMarketingMeta(article.seoTitle, article.seoDescription);

  return (
    <MarketingShell>
      <section className="relative overflow-x-clip bg-[#003048] text-white">
        <div className="container grid items-start gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <Reveal>
            <ul className="flex flex-wrap gap-2">
              {trustPills.map((pill) => (
                <li
                  key={pill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0a4060] px-3 py-1 text-xs font-semibold text-[#d6eef8]"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {pill}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${tone.chip}`}>
                {article.eyebrow}
              </span>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone.label}`}>
                {article.path.startsWith("/platform/") ? "Platform" : "Audience"}
              </p>
            </div>
            <h1 className="mt-4 font-heading text-[2rem] font-extrabold leading-[1.12] sm:text-5xl lg:text-[3.25rem]">
              {article.title}{" "}
              <span className={`mt-1 block sm:mt-2 ${tone.accent}`}>{article.accent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{article.lede}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to={article.primary.to}
                className={`inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#003048] sm:w-auto ${focusRing}`}
              >
                {article.primary.label}
              </Link>
              {article.secondary ? (
                <Link
                  to={article.secondary.to}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold text-[#5ebbd4] sm:w-auto ${focusRingOnDark}`}
                >
                  {article.secondary.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </Reveal>
          {article.stats ? (
            <div className="grid gap-3">
              {article.stats.map((stat, index) => (
                <article key={stat.value} className="rounded-2xl border border-white/15 bg-[#0a4060] p-5">
                  <p
                    className={`font-heading text-3xl font-extrabold ${
                      ["text-[#5ebbd4]", "text-[#7dcec2]", "text-[#c4b4f0]"][index % 3]
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{stat.label}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {process ? (
        <section className="relative overflow-clip bg-[#0a5278] py-12 text-white sm:py-16 lg:py-20">
          <div className="container">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6eef8]">{process.eyebrow}</p>
              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{process.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/80">{process.body}</p>
            </Reveal>
            <ol className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {process.points.map((point, index) => (
                <li key={point} className="min-w-0">
                  <Reveal delay={index * 70}>
                    <article className="flex h-full min-w-0 gap-4 rounded-2xl border border-white/15 bg-[#084866] p-5 sm:flex-col sm:gap-0 sm:p-6">
                      <p className="shrink-0 font-heading text-sm font-bold text-[#c4b4f0]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="min-w-0 text-base font-semibold leading-snug sm:mt-4">{point}</p>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {second ? <SecondBand article={article} split={second} /> : null}

      {trailing.map((split) => (
        <section key={split.title} className="border-t border-[#d3e3ee] bg-[#f0f6fa] py-12 sm:py-16 lg:py-20">
          <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">{split.eyebrow}</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-[#003048] sm:text-3xl">{split.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-[#3e5960]">{split.body}</p>
            </Reveal>
            <ul className="min-w-0 space-y-3">
              {split.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-[#c5d8e4] bg-white px-4 py-3"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3ca8b4]" aria-hidden />
                  <span className="min-w-0 text-sm font-semibold leading-snug text-[#003048]">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section className="bg-[#e7f3f8] py-12 sm:py-16">
        <div className="container flex flex-col items-stretch justify-between gap-6 sm:items-start lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold leading-tight text-[#003048] sm:text-3xl">{article.closing.headline}</h2>
            <p className="mt-3 text-base leading-relaxed text-[#3e5960]">{article.closing.body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={article.primary.to}
              className={`inline-flex h-12 w-full items-center justify-center rounded-full bg-[#003048] px-6 text-sm font-semibold text-white sm:w-auto ${focusRing}`}
            >
              {article.primary.label}
            </Link>
            {article.secondary ? (
              <Link
                to={article.secondary.to}
                className={`inline-flex h-12 w-full items-center justify-center rounded-full border border-[#003048]/25 px-6 text-sm font-semibold text-[#003048] sm:w-auto ${focusRing}`}
              >
                {article.secondary.label}
              </Link>
            ) : (
              <Link
                to="/pricing"
                className={`inline-flex h-12 w-full items-center justify-center rounded-full border border-[#003048]/25 px-6 text-sm font-semibold text-[#003048] sm:w-auto ${focusRing}`}
              >
                See pricing
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#003048] py-12 text-white sm:py-16">
        <div className="container">
          <h2 className="font-heading text-2xl font-bold">Related reading</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {article.related.slice(0, 3).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-2xl border border-white/15 bg-[#0a4060] p-5 hover:bg-[#0d4a6e] ${focusRingOnDark}`}
              >
                <p className="font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-sm text-white/80">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
