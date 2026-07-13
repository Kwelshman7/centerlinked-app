import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is CenterLinked available to the public?",
    answer:
      "No. CenterLinked is built specifically for behavioral healthcare professionals and organizations involved in the referral process — not as a public patient directory.",
  },
  {
    question: "How is information kept accurate?",
    answer:
      "Organizations verify their information every month. Profiles that are not verified are temporarily removed from search results until they have been confirmed.",
  },
  {
    question: "Who controls my organization's information?",
    answer:
      "Your organization controls its own profile through a secure organization dashboard. Updates can be made at any time.",
  },
  {
    question: "Can organizations have multiple facilities?",
    answer:
      "Yes. Organizations can manage multiple facilities, each with its own levels of care, locations, and referral information.",
  },
  {
    question: "How do I create an organization profile?",
    answer:
      "Request access, create your account, and build your organization profile from the dashboard. Once live, you can share a single link with referral partners and keep it current month to month.",
  },
  {
    question: "Does CenterLinked guarantee patient placement?",
    answer:
      "No. CenterLinked helps professionals identify organizations that may be appropriate based on the information organizations provide. Final admission decisions remain with each organization.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14 lg:items-start">
          <div className="space-y-4 max-w-sm lg:sticky lg:top-24">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              FAQ
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Questions teams ask before joining
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Clear answers about accuracy, control, and how CenterLinked fits into referral workflows.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`item-${idx}`}
                className="border border-border rounded-xl px-4 sm:px-6 bg-card shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:shadow-md"
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
