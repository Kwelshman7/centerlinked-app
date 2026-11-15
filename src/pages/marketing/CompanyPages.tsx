import { Link } from "react-router-dom";
import { FormEvent, type ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MarketingShell, useMarketingMeta } from "@/components/marketing/MarketingChrome";
import { insights, operator } from "@/components/marketing/site";

function usePageTitle(title: string, description: string) {
  useMarketingMeta(title, description);
}

const fieldClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-[#d0e4de] bg-white px-3 py-2.5 text-[#0c2c33] outline-none transition focus-visible:border-[#2088b8] focus-visible:ring-2 focus-visible:ring-[#2088b8]/35";

function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-x-clip bg-[#003048] text-white">
      <div className="container max-w-3xl py-12 sm:py-16 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5ebbd4]">{eyebrow}</p>
        <h1 className="mt-4 font-heading text-[2rem] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.25rem]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">{lede}</p>
        {children}
      </div>
    </section>
  );
}

/**
 * Who stands behind the data. Renders once `operator.name` is set in site.ts;
 * until then it stays hidden rather than shipping an unnamed placeholder.
 */
function OperatorBlock() {
  if (!operator.name.trim()) return null;

  return (
    <section className="overflow-x-clip bg-white py-12 sm:py-16 lg:py-20">
      <div className="container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Who runs CenterLinked</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#0c2c33] sm:text-4xl">
            A person you can check.
          </h2>
        </div>
        <div className="mt-8 flex flex-col gap-6 rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
          {operator.photo ? (
            <img
              src={operator.photo}
              alt={`${operator.name}, ${operator.role} at CenterLinked`}
              width={112}
              height={112}
              loading="lazy"
              className="h-28 w-28 shrink-0 rounded-2xl object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-heading text-xl font-bold text-[#0c2c33]">{operator.name}</p>
            {operator.role ? <p className="mt-1 text-sm font-medium text-[#2088b8]">{operator.role}</p> : null}
            {operator.note ? (
              <p className="mt-4 text-base leading-relaxed text-[#3e5960]">{operator.note}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              {operator.profileUrl ? (
                <a
                  href={operator.profileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#2088b8] underline-offset-2 hover:underline"
                >
                  LinkedIn
                </a>
              ) : null}
              {operator.email ? (
                <a href={`mailto:${operator.email}`} className="text-[#2088b8] underline-offset-2 hover:underline">
                  {operator.email}
                </a>
              ) : (
                <Link to="/contact" className="text-[#2088b8] underline-offset-2 hover:underline">
                  Write the team
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutPage() {
  usePageTitle(
    "About CenterLinked | Insurance search for behavioral health",
    "CenterLinked is a work tool for behavioral health business development. Search is free with a work email. Programs list contracts and contacts. No patient records.",
  );

  return (
    <MarketingShell>
      <PageHero
        eyebrow="About"
        title="Built for the call that decides a referral."
        lede="CenterLinked is a work tool for behavioral health business development. People who refer can search with a work email, at no charge. Organizations list programs and keep insurance contracts and contacts current. Patients do not use it, and it does not store clinical records."
      />

      <section className="overflow-x-clip bg-white py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">What we keep in front</p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#0c2c33] sm:text-4xl">
              The weekly job is insurance fit.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#3e5960]">
              Who accepts this payer, at this level of care, in this city, and who picks up. That is the product.
              Everything else stays in service of that answer.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {[
              ["Insurance first", "Search starts with the payer, the level of care, and the place."],
              ["A person", "Results lead with the business development contact, then the program."],
              ["A live sheet", "Program and organization links replace the PDF you would otherwise resend."],
              ["A visible month", "Verification marks a listing fresh, recent, stale, or frozen."],
              ["Free to search", "Business development accounts are free. Membership keeps an organization’s profile maintained."],
              ["Professionals only", "Work email. No patient records. Not a directory for families."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6">
                <h3 className="font-heading text-lg font-bold text-[#0c2c33]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <OperatorBlock />

      <section className="overflow-x-clip border-y border-[#d3e3ee] bg-[#f4f8fb] py-12 sm:py-16 lg:py-20">
        <div className="container max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9771e1]">What we will not build</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#0c2c33] sm:text-4xl">
            A few boundaries, on purpose.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#3e5960]">
            CenterLinked is not a patient chart and not a consumer treatment directory. We do not store protected
            health information, schedule appointments, or open search to the general public. The network stays behind a
            work email so business development reps and programs share the same professional answer: who is in network,
            and who to call.
          </p>
        </div>
      </section>

      <section className="overflow-x-clip bg-white py-12 sm:py-16 lg:py-20">
        <div className="container grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">The job</p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#0c2c33]">Who accepts it, and who answers.</h2>
            <p className="mt-4 text-base leading-relaxed text-[#3e5960]">
              A referral in behavioral health still starts with a payer and a city. CenterLinked is where a business
              development rep, a program, and a referral source look up the same answer: who is in network, and who
              picks up. Monthly verification keeps that answer honest when contracts and contacts change.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/join"
                className="inline-flex h-12 items-center rounded-full bg-[#003048] px-6 text-sm font-semibold text-white"
              >
                Join the network
              </Link>
              <Link
                to="/platform/search"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[#003048]/20 px-6 text-sm font-semibold text-[#003048]"
              >
                How search works
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div id="careers" className="scroll-mt-28 rounded-3xl bg-[#003048] p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5ebbd4]">Careers</p>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight sm:text-3xl">A small team, and no public job board.</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              CenterLinked is a small team. We do not post open roles. If you work in behavioral health referrals and
              want to talk, write us.
            </p>
            <a
              className="mt-8 inline-flex h-12 items-center rounded-full bg-[#5ebbd4] px-6 text-sm font-bold text-[#042028]"
              href="mailto:admin@centerlinked.com?subject=Careers"
            >
              admin@centerlinked.com
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export function PartnersPage() {
  usePageTitle(
    "List a treatment program | CenterLinked",
    "Referral partners search free with a work email. Treatment organizations list programs, contacts, and in-network contracts, and keep them current.",
  );

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Partners"
        title="Put the program where partners can actually use it."
        lede="People who refer search for free with a work email. Organizations list programs, assign the business development contact, and keep insurance contracts on the sheet people open. Monthly verification is how last quarter’s PDF stops being the version everyone trusts."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/join"
            className="inline-flex h-12 items-center rounded-full bg-[#5ebbd4] px-6 text-sm font-bold text-[#042028]"
          >
            Join the network
          </Link>
          <Link
            to="/pricing"
            className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white"
          >
            See membership
          </Link>
        </div>
      </PageHero>

      <section className="overflow-x-clip bg-[#f4f8fb] py-12 sm:py-16 lg:py-20">
        <div className="container grid gap-4 sm:gap-6 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">If you refer</p>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight text-[#0c2c33] sm:text-3xl">Search, then call.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4d656c] sm:text-base">
              A work email is enough, and no card is required. Filter by insurance, level of care, and city. Each row
              leads with the business development contact, so you dial a person instead of a main line.
            </p>
            <Link
              to="/for/bd-reps"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8]"
            >
              For BD reps
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
          <article className="rounded-3xl bg-[#003048] p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5ebbd4]">If you operate programs</p>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight sm:text-3xl">List the contracts and the person.</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
              Claim the organization, assign who answers, and keep verification current so partners are not working
              from last quarter’s PDF. Listing is free. Membership is how the profile stays maintained.
            </p>
            <Link
              to="/for/programs"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5ebbd4]"
            >
              For treatment programs
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        </div>
      </section>

      <section className="overflow-x-clip bg-white py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">On the network</p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#0c2c33] sm:text-4xl">
              Three things a listing has to do.
            </h2>
          </div>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
            {[
              [
                "Be found on the payer",
                "Approved programs with in-network contracts appear when someone searches that insurance, level of care, and city. The result is a program, not a wall of logos.",
              ],
              [
                "Stay honest this month",
                "Edit contracts in the app. Monthly verification marks each facility fresh, recent, stale, or frozen, so a quiet sheet cannot look current.",
              ],
              [
                "Hand off one link",
                "Business development, admissions, and marketing share one program URL for the contracts, the levels of care, and the contact.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-[#d3e3ee] p-6 sm:p-8">
                <h3 className="font-heading text-xl font-bold text-[#0c2c33]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4d656c]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export function ContactPage() {
  usePageTitle(
    "Contact CenterLinked",
    "Write CenterLinked about a listing or a membership question. The form opens your email app. Nothing from it is stored on our servers.",
  );
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const org = String(data.get("org") || "");
    const message = String(data.get("message") || "");
    const body = `Name: ${name}\nEmail: ${email}\nOrganization: ${org}\n\n${message}`;
    window.location.href = `mailto:admin@centerlinked.com?subject=${encodeURIComponent("CenterLinked inquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contact"
        title="Write the team."
        lede="For a work account, join directly. For a listing or a membership question, use the note below. It opens your email app to admin@centerlinked.com. There is no ticket queue behind the button."
      />

      <section className="overflow-x-clip bg-white py-12 sm:py-16">
        <div className="container grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          <form
            onSubmit={onSubmit}
            className="w-full min-w-0 space-y-5 rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6 sm:p-8"
            noValidate={false}
          >
            <div>
              <h2 className="font-heading text-xl font-bold text-[#0c2c33]">Send a note</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">
                Required fields are marked. Submit opens your email app. Nothing from this form is stored on our servers.
              </p>
            </div>

            <label className="block text-sm font-medium text-[#16343c]">
              Name <span className="text-[#9771e1]">*</span>
              <input name="name" type="text" required autoComplete="name" className={fieldClass} />
            </label>

            <label className="block text-sm font-medium text-[#16343c]">
              Work email <span className="text-[#9771e1]">*</span>
              <input name="email" type="email" required autoComplete="email" className={fieldClass} />
            </label>

            <label className="block text-sm font-medium text-[#16343c]">
              Organization
              <input name="org" type="text" autoComplete="organization" className={fieldClass} />
            </label>

            <label className="block text-sm font-medium text-[#16343c]">
              How can we help? <span className="text-[#9771e1]">*</span>
              <textarea name="message" required rows={5} className={`${fieldClass} resize-y`} />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#003048] px-6 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] focus-visible:ring-offset-2 sm:w-auto"
            >
              Email the team
            </button>

            {sent ? (
              <p className="rounded-2xl border border-[#2088b8]/25 bg-white px-4 py-3 text-sm leading-relaxed text-[#2088b8]" role="status">
                Your email app should open with this note addressed to admin@centerlinked.com. If it does not, write that
                address directly.
              </p>
            ) : null}
          </form>

          <div className="flex min-w-0 flex-col gap-4">
            <Link
              to="/join"
              className="block rounded-3xl border border-[#d3e3ee] bg-white p-6 transition hover:border-[#2088b8]/40 hover:bg-[#f4f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Join</p>
              <h2 className="mt-2 font-heading text-xl font-bold text-[#0c2c33]">Create an account</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">
                Work email. Search is free. No card required. Claim an organization later from your profile.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8]">
                Go to join
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <Link
              to="/pricing"
              className="block rounded-3xl border border-[#d3e3ee] bg-white p-6 transition hover:border-[#2088b8]/40 hover:bg-[#f4f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ca8b4]">Membership</p>
              <h2 className="mt-2 font-heading text-xl font-bold text-[#0c2c33]">See plans</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">
                Listing is free. Membership is priced by how many facilities are live. 16+ is quoted.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8]">
                Go to pricing
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <div className="rounded-3xl bg-[#003048] p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5ebbd4]">Direct</p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">Prefer to skip the form?</p>
              <a
                className="mt-4 inline-flex text-sm font-semibold text-[#5ebbd4] underline-offset-2 hover:underline"
                href="mailto:admin@centerlinked.com"
              >
                admin@centerlinked.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export function InsightsIndexPage() {
  usePageTitle(
    "Insights for behavioral health referrals | CenterLinked",
    "Short notes on insurance fit, monthly verification, and why a treatment listing needs a person, not only a main line.",
  );
  const [featured, ...rest] = insights;

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Insights"
        title="Notes on how this work actually goes."
        lede="Short explanations of insurance fit, monthly verification, and the person on the listing. These are not invented case studies."
      />

      <section className="overflow-x-clip bg-white py-12 sm:py-16">
        <div className="container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Featured</p>
          <Link
            to={`/insights/${featured.slug}`}
            className="mt-4 block rounded-3xl bg-[#f4f8fb] p-8 transition hover:bg-[#e7f3f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] sm:p-10"
          >
            <h2 className="font-heading text-2xl font-bold text-[#0c2c33] sm:text-3xl lg:text-4xl">{featured.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3e5960]">{featured.lede}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8]">
              Read more
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {rest.map((article) => (
              <Link
                key={article.slug}
                to={`/insights/${article.slug}`}
                className="rounded-3xl border border-[#d3e3ee] p-6 transition hover:border-[#2088b8]/35 hover:bg-[#f4f8fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] sm:p-8"
              >
                <h2 className="font-heading text-xl font-bold text-[#0c2c33]">{article.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#4d656c]">{article.lede}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8]">
                  Read
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-x-clip bg-[#e7f3f8] py-12 sm:py-16">
        <div className="container flex flex-col items-stretch justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold leading-tight text-[#0c2c33] sm:text-3xl">Ready to search?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3e5960] sm:text-base">
              A work email is enough. Search is free. No card is required.
            </p>
          </div>
          <Link
            to="/join"
            className="inline-flex h-12 shrink-0 items-center rounded-full bg-[#003048] px-6 text-sm font-semibold text-white"
          >
            Join the network
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

export function InsightArticlePage({ slug }: { slug: string }) {
  const article = insights.find((item) => item.slug === slug);

  usePageTitle(
    article ? `${article.title} | CenterLinked` : "Insights | CenterLinked",
    article?.seoDescription ?? "Notes on insurance fit, verification, and the person on a treatment listing.",
  );

  if (!article) return null;

  return (
    <MarketingShell>
      <article className="overflow-x-clip bg-white">
        <div className="container max-w-3xl py-12 sm:py-16">
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2088b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] focus-visible:ring-offset-2"
          >
            ← All insights
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Insight</p>
          <h1 className="mt-3 font-heading text-[2rem] font-extrabold leading-[1.15] tracking-tight text-[#0c2c33] sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#3e5960]">{article.lede}</p>
          <div className="mt-10 space-y-6 text-base leading-[1.75] text-[#243f46]">
            {article.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-14 border-t border-[#d3e3ee] pt-8">
            <Link
              to="/join"
              className="inline-flex h-12 items-center rounded-full bg-[#003048] px-6 text-sm font-semibold text-white"
            >
              Join the network
            </Link>
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}
