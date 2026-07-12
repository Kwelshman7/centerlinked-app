import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is this just another treatment directory?",
    answer:
      "No. Directories help families find care online. CenterLinked is for professional referral partners who already know you — and need current insurance, LOC, and contacts fast.",
  },
  {
    question: "How is this different from our CRM?",
    answer:
      "Your CRM tracks your outreach. CenterLinked is what partners see about you. Most teams use both.",
  },
  {
    question: "What happens when our information changes?",
    answer:
      "Update the profile once. Every shared link reflects it instantly — no mass email, no new PDF.",
  },
  {
    question: "Who from our organization gets access?",
    answer:
      "Everyone under one account — BD, admissions, leadership. No per-seat fees.",
  },
  {
    question: "Is CenterLinked invite-only?",
    answer:
      "Yes during early access. We approve licensed behavioral health organizations to keep the network credible.",
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
            Quick answers
          </h2>
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
