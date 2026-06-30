import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Problem } from "@/components/landing/Problem";
import { Positioning } from "@/components/landing/Positioning";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { AlwaysAccurate } from "@/components/landing/AlwaysAccurate";
import { WhoFor } from "@/components/landing/WhoFor";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Problem />
        <Positioning />
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <ProductShowcase />
        <section id="features">
          <AlwaysAccurate />
        </section>
        <WhoFor />
        <section id="pricing">
          <Pricing />
        </section>
        <section id="faq">
          <FAQ />
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
