import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ProfileInventory } from "@/components/landing/ProfileInventory";
import { WhoFor } from "@/components/landing/WhoFor";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { OrgDashboardSection } from "@/components/landing/OrgDashboardSection";
import { VerifiedMonthly } from "@/components/landing/VerifiedMonthly";
import { Pricing } from "@/components/landing/Pricing";
import { PositioningBoundary } from "@/components/landing/PositioningBoundary";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

/**
 * Landing journey:
 * Hero → trusted/current profile → who it’s for → how it works →
 * product proof → dashboard → monthly verification → pricing →
 * why CenterLinked → FAQ → convert
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <ProfileInventory />
        <WhoFor />
        <HowItWorks />
        <ProductShowcase />
        <OrgDashboardSection />
        <VerifiedMonthly />
        <section id="pricing">
          <Pricing />
        </section>
        <PositioningBoundary />
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
