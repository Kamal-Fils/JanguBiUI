import { AlternatingSection } from '@/features/landing/components/alternating-section';
import { CtaSection } from '@/features/landing/components/cta-section';
import { FeaturesSection } from '@/features/landing/components/features-section';
import { HeroSection } from '@/features/landing/components/hero-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingNav } from '@/features/landing/components/landing-nav';
import { PourQuiSection } from '@/features/landing/components/pour-qui-section';
import { StatsSection } from '@/features/landing/components/stats-section';
import { TestimonialsSection } from '@/features/landing/components/testimonials-section';

const HomePage = () => {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <AlternatingSection />
        <PourQuiSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
};

export default HomePage;
