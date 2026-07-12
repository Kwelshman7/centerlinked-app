import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What exactly is CenterLinked?",
    answer:
      "CenterLinked is a live referral profile for behavioral health organizations. You put levels of care, verified insurance, locations, BD contacts, and how-to-refer details in one place — then share a single link with professional partners. When you update the profile, every shared link stays current.",
  },
  {
    question: "Is this just another treatment directory?",
    answer:
      "No. Directories help families find care online. CenterLinked is built for professional referral partners who already know you — or are placing a client — and need current insurance, LOC, and contacts fast.",
  },
  {
    question: "How is this different from our CRM?",
    answer:
      "Your CRM tracks your outreach and pipeline. CenterLinked is what partners see about you. Most teams use both: CRM for your side of the relationship, CenterLinked for theirs.",
  },
  {
    question: "Why not just keep sending PDFs?",
    answer:
      "PDFs go stale the moment something changes — and partners rarely open last quarter's attachment. A live link means insurance, contacts, and programs stay accurate without another mass email.",
  },
  {
    question: "What happens when our information changes?",
    answer:
      "Update the profile once. Every shared link reflects it instantly — no new PDF, no \"please delete the old one\" follow-up.",
  },
  {
    question: "Do we list specific insurance payers?",
    answer:
      "Yes. Partners need named in-network payers they can act on — not \"we take most insurance.\" You control what's published and keep it verified.",
  },
  {
    question: "Is patient information involved? Is this HIPAA?",
    answer:
      "CenterLinked is built for organizational and facility referral information — programs, insurance panels, contacts — not protected health information about individual patients. You decide what your organization publishes.",
  },
  {
    question: "Who from our organization gets access?",
    answer:
      "Everyone under one organization account — BD, admissions, and leadership. No per-seat fees.",
  },
  {
    question: "Will this get us more referrals?",
    answer:
      "CenterLinked makes it easier for partners who already want to refer to you to do it correctly and confidently. It won't replace relationship-building — it removes friction when those relationships lead to a placement.",
  },
  {
    question: "Is CenterLinked invite-only?",
    answer:
      "Yes during early access. We approve licensed behavioral health organizations so the network stays credible for professional referrals.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            FAQ
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Questions BD teams actually ask
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Straight answers about what CenterLinked is — and what it isn't.
          </p>
        </div>

        <div className="mx-auto mt-10 sm:mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-border rounded-xl px-4 sm:px-6 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4 sm:py-5 hover:text-primary transition-colors text-sm sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 sm:pb-5 leading-relaxed text-sm sm:text-[15px]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
