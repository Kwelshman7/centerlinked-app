import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Problem } from "@/components/landing/Problem";
import { Positioning } from "@/components/landing/Positioning";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProfileInventory } from "@/components/landing/ProfileInventory";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { OrgDashboardSection } from "@/components/landing/OrgDashboardSection";
import { AlwaysAccurate } from "@/components/landing/AlwaysAccurate";
import { VerifiedMonthly } from "@/components/landing/VerifiedMonthly";
import { WhoFor } from "@/components/landing/WhoFor";
import { PositioningBoundary } from "@/components/landing/PositioningBoundary";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

/**
 * Landing journey (RVKAI-inspired layout, CenterLinked content):
 * Hero + carousel → trust → problem → shift → system → inventory →
 * product proof → dashboard → why join → accuracy → who → boundary →
 * pricing → FAQ → convert
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Problem />
        <Positioning />
        <HowItWorks />
        <ProfileInventory />
        <ProductShowcase />
        <OrgDashboardSection />
        <AlwaysAccurate />
        <VerifiedMonthly />
        <WhoFor />
        <PositioningBoundary />
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
