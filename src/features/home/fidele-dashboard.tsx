'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { SectionHeader } from '@/components/ui/section-header';
import { FideleSummarySection } from '@/features/dashboard/components/fidele-summary-section';
import { PastoralReflectionWidget } from '@/features/reflexion-pastorale/components/pastoral-reflection-widget';

import { DailyReadingCard } from './daily-reading-card';
import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';
import { WelcomeBanner } from './welcome-banner';

export function FideleDashboard() {
  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-8">
        <WelcomeBanner />

        {/* Lecture du jour — carte éditoriale pleine largeur */}
        <DailyReadingCard />

        {/* La grille « Accès rapides » a été retirée (retour testeurs n°5 :
            Intentions apparaissait trois fois sur le dashboard). Les accès
            vivent dans les pastilles du héro + la nav + « Mes intentions ». */}

        {/* Résumé (stats) — pleine largeur */}
        <FideleSummarySection />

        <div className="hairline-gold" aria-hidden="true" />

        {/* Bento éditorial : actualité + agenda (2/3) · réflexion + intentions (1/3) */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <SectionHeader
                eyebrow="Vie de la communauté"
                title="Ma paroisse"
                actionHref="/app/actus"
              />
              <ParishNewsSection />
            </section>
            <section>
              <SectionHeader
                eyebrow="Calendrier"
                title="Événements à venir"
                actionHref="/app/agenda"
                actionLabel="Agenda"
              />
              <ParishEventsSection />
            </section>
          </div>
          <div className="flex flex-col gap-8">
            <section>
              <SectionHeader eyebrow="Méditation" title="Réflexion du jour" />
              <PastoralReflectionWidget />
            </section>
            <section>
              <SectionHeader
                eyebrow="Prière"
                title="Mes intentions"
                actionHref="/app/intentions"
              />
              <MyIntentionsSection />
            </section>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
