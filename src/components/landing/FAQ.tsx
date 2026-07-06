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
      "CenterLinked is a referral-facing profile platform built for behavioral health and addiction treatment organizations. You create one professional profile that shows referral partners what levels of care you offer, where you're located, who you're in-network with, who to contact, and how to send a referral. Your BD team shares one link — everywhere, always current.",
  },
  {
    question: "Is this just another treatment directory?",
    answer:
      "No. Public directories are built for patients and families searching online. CenterLinked is built for professional referral relationships — with clinicians, case managers, hospital discharge teams, interventionists, other treatment organizations, and BD reps. Different audience, different purpose.",
  },
  {
    question: "How is this different from our CRM?",
    answer:
      "Your CRM is internal — it tracks your contacts, tasks, outreach activity, and pipeline. CenterLinked is external — it's what your partners see about you. Your CRM helps you manage relationships. CenterLinked helps those partners understand your organization well enough to refer to you. They do different jobs. You need both.",
  },
  {
    question: "Why not just update our website?",
    answer:
      "Your website is built for every audience — patients, families, Google, alumni, community. CenterLinked is built specifically for referral partners. Your website explains your brand. CenterLinked explains exactly how to refer to you — down to the right contact, the right payer, and the referral process.",
  },
  {
    question: "Why not just send a PDF or one-pager?",
    answer:
      "Because PDFs go stale. A phone number changes, a BD rep leaves, you go in-network with a new plan, or you open a new level of care — and every PDF out in the wild is now wrong. CenterLinked gives you one live link. Update it once and it's accurate everywhere. No recall, no re-send, no follow-up to correct wrong information.",
  },
  {
    question: "Can our BD reps actually use this in the field?",
    answer:
      "That's exactly what it's for. After a conference meeting, in a follow-up text, on a printed QR code at your trade show booth, in a referral packet — your reps send one link instead of juggling attachments. And when something changes, you update the profile and their link is automatically current.",
  },
  {
    question: "Can we list our insurance and payer relationships?",
    answer:
      "Yes. You can list in-network payers clearly and accurately. This is one of the most valuable things you can put on your profile — referral partners make placement decisions based on insurance fit. Just be clear that benefits verification still happens through your normal admissions process. CenterLinked shows payer relationships; it doesn't verify individual benefits.",
  },
  {
    question: "Is CenterLinked HIPAA compliant?",
    answer:
      "CenterLinked is an organization profile and referral information platform — not a place to store patient records or clinical data. Don't put PHI in your profile. Treat it as a public-facing professional profile. Keep clinical, patient, and billing data inside the systems built for it.",
  },
  {
    question: "Does CenterLinked replace our admissions process?",
    answer:
      "No. CenterLinked helps referral partners understand your organization and make the right initial contact. Everything that happens after that — clinical screening, insurance verification, admissions decisions — stays in your hands through your normal process. CenterLinked gets the right referral to the right door. What happens after that is yours.",
  },
  {
    question: "Will CenterLinked get us more referrals?",
    answer:
      "Here's the honest answer: CenterLinked reduces friction. Referral partners who already know you can reach the right person faster. Partners who don't know you yet can understand your program clearly and decide if you're the right fit. That means fewer missed connections, fewer misrouted referrals, and a better chance that a good-fit referral actually finds you. We can't manufacture relationships — but we can make sure they don't fail because of bad information.",
  },
  {
    question: "What happens if we don't keep our profile updated?",
    answer:
      "After 30 days without confirmation, your Verified badge changes to 'Needs Verification' and your organization stops appearing in open search until you update. Existing partners can still see your profile, with that flag visible. This is intentional — the value of CenterLinked depends on the network being accurate. Stale information loses visibility. Current information earns it.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Questions we actually get asked
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Honest answers for treatment organizations, BD teams, admissions leaders, and referral partners.
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
