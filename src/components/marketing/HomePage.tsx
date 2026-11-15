import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { PublicFacilitySheetPreviewContent } from "@/components/landing/PublicFacilitySheetPreview";
import { PublicOrgSheetPreviewContent } from "@/components/landing/PublicOrgSheetPreview";
import { SearchInteractiveDemo } from "@/components/landing/SearchInteractiveDemo";
import { DEMO_ORG, FEATURED_FACILITY } from "@/components/landing/demoOrgData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMarketingMeta } from "./MarketingChrome";
import { Reveal } from "./Reveal";
import { audiences, directorySnapshot, faqs, platform, testimonials } from "./site";

const focusOnDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ebbd4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#003048]";
const focusOnLight =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const focusOnSoft =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8fb]";

const problemStats = [
  {
    value: "Payer",
    label:
      "In network is the question that decides whether a referral can move. A logo on a brochure does not name the plan.",
  },
  {
    value: "Place",
    label:
      "A program in another state is not a match when someone needs to stay close to home. The city belongs next to the contract.",
  },
  {
    value: "Person",
    label:
      "A building does not pick up the phone. You need the business development contact, with a number or an email the program chose to publish.",
  },
];

const solution = [
  {
    title: "Search with the questions you already ask.",
    body: "Insurance, level of care, state, and city sit in front. Plan type, ZIP, specialty, and accreditation stay one click away when you need them. The list is approved programs with a matching in-network contract. A facility that verification has frozen does not stay on it.",
  },
  {
    title: "See the person before you see the building.",
    body: "Each row leads with the business development contact, then the program, the organization, and the city. Phone and email are on the row when the program published them, so you are not hunting a main line after you already found the fit.",
  },
  {
    title: "Send a link that stays current.",
    body: "Public program and organization pages replace the attachment. Levels of care, contracts, and the contact live on the page. When the contract changes, you edit the listing. The link your partner already has shows the update.",
  },
  {
    title: "Know whether someone confirmed it this month.",
    body: "Monthly verification marks a facility fresh, recent, stale, or frozen. Fresh means within 30 days. Recent means 31 to 60. Stale means it needs confirmation. Frozen leaves search. You still confirm the bed on the phone.",
  },
  {
    title: "Become the rep other people call first.",
    body: "The reps who get the first call are the ones who can answer a placement question on the spot. Contacts keeps the people you have already worked with — the program, the payer they take, and the number that reaches them. The next time someone asks who takes this plan in this city, you answer in a minute instead of a day.",
  },
];

const sectionEyebrow =
  "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]";
const sectionPad = "py-12 sm:py-16 lg:py-20";
const sectionTitle = "font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl";
const sectionBody = "mt-4 text-base leading-relaxed text-pretty sm:mt-5 sm:text-lg";

export function HomePage() {
  useMarketingMeta(
    "Find in-network behavioral health programs | CenterLinked",
    "Search approved treatment programs by payer, level of care, and city. See the business development contact, and share a live listing instead of a PDF.",
  );

  return (
    <>
      <section className="relative overflow-x-clip bg-[#003048] text-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#0a5278]" />
        <div className="container relative grid items-center gap-10 pb-14 pt-10 sm:gap-12 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-20 lg:pt-16">
          <Reveal>
            <ul className="flex flex-wrap gap-2">
              {["Work-email accounts", "In-network contracts", "Monthly verification", "No patient records"].map(
                (pill) => (
                  <li
                    key={pill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0a4060] px-3 py-1 text-xs font-semibold text-[#d6eef8]"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {pill}
                  </li>
                ),
              )}
            </ul>
            <h1 className="mt-6 font-heading text-[2rem] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Behavioral health BD teams: find who accepts the insurance,
              <span className="mt-1 block text-[#5ebbd4] sm:mt-2">and who to call</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
              Placing someone in treatment usually starts with a plan, a level of care, and a city. Those answers are
              often split across an old PDF, a text thread, and a main line. CenterLinked is where business development
              teams and treatment programs look at the same listing: the contract, the care, and the person who answers.
            </p>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#d6eef8] sm:text-base">
              People who refer can search with a work email, at no charge. Programs can list for free, and update the
              sheet when a contract or a contact changes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/platform/search"
                className={`inline-flex h-12 min-h-[44px] w-full items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#003048] transition hover:bg-[#e7f3f8] sm:w-auto ${focusOnDark}`}
              >
                See how search works
              </Link>
              <Link
                to="/join"
                className={`inline-flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-[#5ebbd4] transition hover:text-white sm:w-auto ${focusOnDark}`}
              >
                Join free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120} className="flex justify-center lg:justify-end">
            <HeroSearchPhone />
          </Reveal>
        </div>
      </section>

      <section className={`relative overflow-clip bg-gradient-to-b from-[#0a5278] to-[#003048] text-white ${sectionPad}`}>
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#2088b8]/25" />
        <div className="container relative">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className={`${sectionEyebrow} bg-white/10 text-[#d6eef8]`}>The problem</p>
            <h2 className={`mt-5 ${sectionTitle}`}>
              The contract, the city, and the contact rarely live in the same place.
            </h2>
            <p className={`${sectionBody} text-white/80`}>
              If you do business development, you already know this version of the morning. You have a payer and a
              level of care, and you are not sure which program in that city still takes it. If you run a program, you
              sent a one-pager last quarter and you cannot tell who is still using it. The time disappears in the call
              between those two people.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
            {problemStats.map((stat, index) => (
              <Reveal key={stat.value} delay={index * 80}>
                <article className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <p className="font-heading text-4xl font-extrabold text-[#c4b4f0] sm:text-5xl">{stat.value}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{stat.label}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`relative overflow-clip bg-[#003048] text-white ${sectionPad}`}>
        <div className="pointer-events-none absolute -right-10 top-16 h-48 w-48 rounded-full bg-white/90" />
        <div className="pointer-events-none absolute right-24 top-36 h-28 w-28 rounded-full bg-[#e6def8]" />
        <div className="container relative">
          <Reveal className="max-w-2xl">
            <p className={`${sectionEyebrow} bg-[#0a4060] text-[#d6eef8]`}>Who it’s for</p>
            <h2 className={`mt-5 ${sectionTitle}`}>
              Different jobs. <span className="text-[#c4b4f0]">The same questions.</span>
            </h2>
            <p className={`${sectionBody} max-w-xl text-white/75`}>
              A referring partner, a single program, and a group with several sites are not doing the same work. They
              still need the same facts: who is in network, at which level of care, in which city, and who answers.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a8c9d8] sm:text-base">
              <span className="font-semibold text-white/90">Who it is not for:</span> patients and families comparing
              programs on their own, and anyone looking for a clinical system. There are no charts here, no scheduling,
              and no messages to patients. Accounts are for people who place and receive referrals for a living.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {audiences.map((item, index) => (
              <Reveal key={item.to} delay={index * 60}>
                <Link
                  to={item.to}
                  className={`group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07] ${focusOnDark}`}
                >
                  <h3 className="font-heading text-xl font-bold">{item.label}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-white/70">{item.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5ebbd4]">
                    Read the guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`overflow-x-clip bg-[#f4f8fb] ${sectionPad}`}>
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className={`${sectionEyebrow} bg-white text-[#2088b8] shadow-sm`}>The product</p>
            <h2 className={`mt-5 ${sectionTitle} text-[#0c2c33]`}>What changes when the listing stays current.</h2>
            <p className={`${sectionBody} text-[#3e5960]`}>
              A referral should not depend on a PDF nobody owns, a voicemail nobody returned, and a contract nobody has
              checked since the last conference. Here is what the product actually puts in one place.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="space-y-8">
              {solution.map((item, index) => (
                <Reveal key={item.title} delay={index * 70}>
                  <h3 className="font-heading text-xl font-bold text-[#0c2c33]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3e5960] sm:text-base">{item.body}</p>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                <figure className="min-w-0 text-center">
                  <PhoneFrame className="w-[min(42vw,176px)]">
                    <PublicOrgSheetPreviewContent />
                  </PhoneFrame>
                  <figcaption className="mt-3 text-xs font-semibold text-[#4d656c]">Organization sheet</figcaption>
                </figure>
                <figure className="min-w-0 text-center">
                  <PhoneFrame className="w-[min(42vw,176px)]">
                    <PublicFacilitySheetPreviewContent />
                  </PhoneFrame>
                  <figcaption className="mt-3 text-xs font-semibold text-[#4d656c]">Program sheet</figcaption>
                </figure>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className={`bg-white ${sectionPad}`}>
        <div className="container grid items-start gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">
              Why both sides use the same listing
            </p>
            <h2 className={`mt-3 ${sectionTitle} text-[#0c2c33]`}>
              A brochure can name a program. It cannot tell you who still answers.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#3e5960]">
              In a lot of healthcare, the referring side and the receiving side can see the same information before
              anyone picks up the phone. Behavioral health referrals are more personal than that, and the useful
              version is narrower: this payer, this level of care, this city, this person.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#3e5960]">
              Business development reps and referral sources can search without a subscription, which gives a program
              a reason to keep the listing accurate. Membership is how an organization maintains the sheet, the
              contracts, and the monthly verification.
            </p>
          </Reveal>
          <div className="grid gap-4">
            {[
              [
                "Work email",
                "Accounts are for professionals. Personal email domains stay blocked unless they have been approved. Patients do not search here.",
              ],
              [
                "In network",
                "Search returns approved programs with a contract for the payer you chose. A frozen listing does not stay in the results.",
              ],
              [
                "Monthly",
                "Verification states are fresh, recent, stale, and frozen. The badge is on the listing before you call.",
              ],
              [
                "No patient record",
                "No charts, no scheduling, and no messages to patients. The product stops at the professional handoff.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-[#d3e3ee] p-6">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2088b8]" />
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#0c2c33]">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`bg-[#f4f8fb] ${sectionPad}`}>
        <div className="container">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">
              An example, not a customer
            </p>
            <h2 className={`mt-3 ${sectionTitle} text-[#0c2c33]`}>What a match looks like.</h2>
            <p className="mt-5 text-base leading-relaxed text-[#4d656c]">
              Northbend Recovery and Summit Grove are made-up names. We use them on this site so a real program’s phone
              number never appears on a marketing page.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-2">
            <article className="rounded-3xl bg-[#003048] p-6 text-white sm:p-8">
              <p className="text-sm text-white/60">A business development rep searching Aetna PPO in North Carolina</p>
              <p className="mt-4 font-heading text-2xl font-bold leading-snug">
                {DEMO_ORG.userFullName} · {FEATURED_FACILITY.name}
              </p>
              <p className="mt-3 text-white/75">
                {FEATURED_FACILITY.location}. {FEATURED_FACILITY.levels.join(", ")}. {FEATURED_FACILITY.payers[0]} in
                network. {DEMO_ORG.userPhone}.
              </p>
            </article>
            <article className="rounded-3xl border border-[#d3e3ee] bg-white p-6 sm:p-8">
              <p className="text-sm text-[#4d656c]">A program that used to send a PDF</p>
              <p className="mt-4 font-heading text-2xl font-bold leading-snug text-[#0c2c33]">
                One link for the contracts, the levels of care, and the person who answers.
              </p>
              <Link
                to="/platform/listings"
                className={`mt-6 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-[#2088b8] transition hover:text-[#003048] ${focusOnSoft}`}
              >
                See listings <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <DirectoryStats />

      <Testimonials />

      <section className={`bg-white ${sectionPad}`}>
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Look closer</p>
            <h2 className={`mt-3 ${sectionTitle} text-[#0c2c33]`}>Four parts of the same answer.</h2>
            <p className="mt-4 text-base leading-relaxed text-[#3e5960]">
              Search finds the fit. The listing is what you send. Verification tells you whether it is still current.
              Contacts is where the person lives after the call.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platform.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-3xl bg-[#f4f8fb] p-6 transition hover:bg-[#e7f3f8] ${focusOnLight}`}
            >
              <h3 className="font-heading text-lg font-bold text-[#0c2c33]">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">{item.description}</p>
            </Link>
          ))}
          </div>
        </div>
      </section>

      <section id="faq" className={`bg-[#f4f8fb] ${sectionPad}`}>
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className={`${sectionEyebrow} bg-white text-[#2088b8] shadow-sm`}>Before you sign up</p>
            <h2 className={`mt-5 ${sectionTitle} text-[#0c2c33]`}>The questions we get asked first.</h2>
          </Reveal>
          <Accordion type="single" collapsible className="mx-auto mt-8 max-w-2xl space-y-3 sm:mt-10">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="rounded-2xl border border-[#d3e3ee] bg-white px-4 shadow-sm transition-colors data-[state=open]:border-[#2088b8]/35 sm:px-6"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-semibold text-[#0c2c33] hover:text-[#2088b8] hover:no-underline sm:py-5 sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-[#4d656c] sm:pb-5 sm:text-[15px]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className={`bg-[#003048] text-white ${sectionPad}`}>
        <div className="container flex flex-col items-stretch justify-between gap-8 sm:items-start lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className={sectionTitle}>Start with the search you already run every week.</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:mt-5">
              Create an account with your work email. Search is free. When you are ready to maintain a program, claim
              the organization from your profile and keep the sheet current.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              to="/join"
              className={`inline-flex h-12 min-h-[44px] items-center justify-center rounded-full bg-[#5ebbd4] px-6 text-sm font-bold text-[#042028] transition hover:bg-[#7ecce0] ${focusOnDark}`}
            >
              Join the network
            </Link>
            <Link
              to="/pricing"
              className={`inline-flex h-12 min-h-[44px] items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold transition hover:bg-white/10 ${focusOnDark}`}
            >
              Plans and pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Directory proof. Renders only once `directorySnapshot` carries real, dated
 * numbers — including the professional count, which is the one figure behind
 * the "who you already know" claim. No snapshot, no block.
 */
function DirectoryStats() {
  if (!directorySnapshot) return null;
  const { asOf, facilities, contracts, payers, states, professionals } = directorySnapshot;
  const cells: Array<[number, string]> = [
    [facilities, "Facilities listed"],
    [contracts, "In-network contracts"],
    [payers, "Payers"],
    [states, "States"],
    [professionals, "Professionals on the network"],
  ];

  return (
    <section className={`bg-white ${sectionPad}`}>
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">
            Already in the directory
          </p>
          <h2 className={`mt-3 ${sectionTitle} text-[#0c2c33]`}>What is on the network right now.</h2>
        </Reveal>
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-5">
          {cells.map(([value, label]) => (
            <div key={label} className="rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6 text-center">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-heading text-3xl font-extrabold tabular-nums text-[#0c2c33] sm:text-4xl">
                  {value.toLocaleString("en-US")}
                </span>
                <span className="mt-2 block text-sm leading-snug text-[#4d656c]">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-center text-xs text-[#4d656c]">Directory counts as of {asOf}.</p>
      </div>
    </section>
  );
}

/**
 * Named-user proof. Hidden until real quotes exist. Everyone pictured elsewhere
 * on this site is labeled sample data, so a placeholder person here would
 * undo the thing this block is meant to establish.
 */
function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section className={`bg-[#f4f8fb] ${sectionPad}`}>
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">
            From people doing the work
          </p>
          <h2 className={`mt-3 ${sectionTitle} text-[#0c2c33]`}>Real accounts, real names.</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={`${item.name}-${item.organization}`} className="rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6">
              <blockquote className="text-sm leading-relaxed text-[#14343c] sm:text-base">“{item.quote}”</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="block font-semibold text-[#0c2c33]">{item.name}</span>
                <span className="block text-[#4d656c]">
                  {item.role}, {item.organization}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroSearchPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] pb-2 sm:pb-4">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3ca8b4]/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-6 top-24 h-36 w-36 rounded-full bg-[#9771e1]/70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 bottom-20 h-28 w-28 rounded-full bg-[#54a89c]"
        aria-hidden
      />
      <PhoneFrame className="relative mx-auto w-[220px] sm:w-[250px] lg:w-[280px] animate-float">
        <SearchInteractiveDemo />
      </PhoneFrame>
    </div>
  );
}
