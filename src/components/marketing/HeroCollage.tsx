import { DEMO_ORG, FEATURED_FACILITY } from "@/components/landing/demoOrgData";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";

/** Example cards only. Northbend is a fictional demo org. */
export function HeroCollage() {
  return (
    <>
      <div className="mx-auto grid max-w-md gap-3 sm:hidden">
        <ContactCard />
        <InsuranceCard />
      </div>
      <div className="relative mx-auto hidden h-[520px] w-full max-w-[520px] sm:block" aria-hidden>
        <div className="absolute right-10 top-8 h-72 w-72 rounded-full bg-[#3ca8b4]" />
        <div className="absolute bottom-6 left-2 h-36 w-36 rounded-full bg-[#9771e1]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] overflow-hidden rounded-full border-[6px] border-[#003048] shadow-2xl animate-float">
          <img src={facility1} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          className="absolute bottom-10 left-6 h-44 w-44 overflow-hidden rounded-full border-[6px] border-[#003048] shadow-2xl animate-float"
          style={{ animationDelay: "1.1s" }}
        >
          <img src={facility2} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute left-0 top-16 w-[230px] animate-float" style={{ animationDelay: "0.35s" }}>
          <ContactCard />
        </div>
        <div className="absolute bottom-8 right-2 w-[220px] animate-float" style={{ animationDelay: "0.7s" }}>
          <InsuranceCard />
        </div>
      </div>
    </>
  );
}

function ContactCard() {
  return (
    <article className="rounded-2xl bg-white p-4 text-[#12343c] shadow-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2088b8]">Example · BD contact</p>
      <p className="mt-2 font-heading text-lg font-bold leading-tight">{DEMO_ORG.userFullName}</p>
      <p className="text-xs text-[#4d656c]">{DEMO_ORG.userTitle}</p>
      <p className="mt-3 text-sm font-semibold">{FEATURED_FACILITY.name}</p>
      <p className="text-xs text-[#4d656c]">{FEATURED_FACILITY.location}</p>
      <p className="mt-3 text-sm font-semibold text-[#2088b8]">{DEMO_ORG.userPhone}</p>
    </article>
  );
}

function InsuranceCard() {
  return (
    <article className="rounded-2xl bg-white p-4 text-[#12343c] shadow-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2088b8]">Example · in network</p>
      <p className="mt-2 text-sm font-semibold">{FEATURED_FACILITY.payers[0]}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-[#4d656c]">Verification</span>
        <span className="rounded-full bg-[#e5f8ef] px-2 py-0.5 text-xs font-bold text-[#0f7a45]">Fresh</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e6eef0]">
        <div className="h-full w-4/5 rounded-full bg-[#2088b8]" />
      </div>
      <p className="mt-2 text-xs text-[#4d656c]">{FEATURED_FACILITY.levels.slice(0, 3).join(" · ")}</p>
    </article>
  );
}
