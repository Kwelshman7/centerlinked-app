import { Star, TrendingUp, Award, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "CenterLinked is the easiest way to see who is actually in-network — not who just 'accepts Cigna.' That distinction matters more than people think when you're trying to place a client quickly.",
    author: "Jessica R.",
    role: "Director of Business Development,\nFlorida Recovery Network",
    avatar: "JR",
  },
  {
    quote: "One link replaces every PDF, every spreadsheet, and every 'wait, is that contract still active?' email. It's the source of truth our industry has needed for a long time.",
    author: "Michael T.",
    role: "Regional Outreach Manager",
    avatar: "MT",
  },
];

const socialProof = [
  {
    icon: TrendingUp,
    text: "Faster placement decisions for multi-facility BD teams.",
  },
  {
    icon: Award,
    text: "Trusted by treatment networks across the U.S.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What BD leaders are saying
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Quote className="h-4 w-4" />
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              <blockquote className="text-lg text-foreground leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          {socialProof.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-accent/50 border border-primary/20 hover:border-primary/40 transition-colors duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
