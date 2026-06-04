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
  // La landing conserve son identité nocturne (navy + étoiles) quel que soit
  // le thème de l'app (désormais light-first) : on force le palette dark ici.
  return (
    <div className="dark bg-background text-foreground">
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
    </div>
  );
};

export default HomePage;
