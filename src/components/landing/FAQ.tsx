import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionBadge } from "./SectionBadge";
import { DisplayHeading } from "./DisplayHeading";

const faqs = [
  {
    question: "Is CenterLinked a public treatment directory?",
    answer:
      "No. CenterLinked is a professional referral network for behavioral healthcare organizations and the partners who place patients — not a patient-facing directory.",
  },
  {
    question: "What do I share with referral partners?",
    answer:
      "Your organization link. It’s a live profile with facilities, insurance, contacts, and how to refer. When you update the dashboard, every partner who opens that link sees the latest information.",
  },
  {
    question: "How is information kept accurate?",
    answer:
      "Organizations verify their profile every month. Profiles that aren’t verified are flagged until they’re confirmed again — so partners aren’t relying on outdated information.",
  },
  {
    question: "Who controls our organization’s information?",
    answer:
      "You do. Your team manages the profile through a secure organization dashboard and can update it anytime.",
  },
  {
    question: "Can we list multiple facilities?",
    answer:
      "Yes. Organizations can manage multiple facilities — each with its own levels of care, location, and referral details — under one organization link.",
  },
  {
    question: "Does CenterLinked guarantee placements?",
    answer:
      "No. CenterLinked helps partners confirm fit based on the information you provide. Final admission decisions stay with each organization.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14 lg:items-start">
          <div className="space-y-4 max-w-sm lg:sticky lg:top-24">
            <SectionBadge>FAQ</SectionBadge>
            <DisplayHeading as="h2">Questions before you share your first link</DisplayHeading>
            <p className="text-base text-muted-foreground leading-relaxed">
              How CenterLinked fits referral workflows — accuracy, control, and what the
              network is (and isn’t).
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`item-${idx}`}
                className="border border-border rounded-2xl px-4 sm:px-6 bg-card shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:shadow-md"
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
