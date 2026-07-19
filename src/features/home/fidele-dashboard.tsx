'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { FideleSummarySection } from '@/features/dashboard/components/fidele-summary-section';
import { PastoralReflectionWidget } from '@/features/reflexion-pastorale/components/pastoral-reflection-widget';

import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';
import { WordOfTheDay } from './word-of-the-day';

/**
 * Accueil du fidèle.
 *
 * Hiérarchie assumée : la Parole du jour ouvre la page en pleine échelle,
 * puis la vie de la paroisse, puis ce qui appartient en propre au fidèle
 * (sa méditation, ses intentions). L'ancienne bannière de bienvenue — un
 * bloc dégradé portant le prénom en très grand — a cédé la place : elle
 * occupait la position de force pour une information sans valeur d'usage.
 */
export function FideleDashboard() {
  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-10">
        <WordOfTheDay />

        <FideleSummarySection />

        <div className="hairline-gold" aria-hidden="true" />

        {/* Bento éditorial : la communauté à gauche (2/3), l'intime à droite */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-10 lg:col-span-2">
            <section>
              <SectionHeader
                eyebrow="Vie de la communauté"
                title="Ma paroisse"
                actionHref={paths.app.actus.getHref()}
              />
              <ParishNewsSection />
            </section>
            <section>
              <SectionHeader
                eyebrow="Calendrier"
                title="Événements à venir"
                actionHref={paths.app.agenda.getHref()}
                actionLabel="Agenda"
              />
              <ParishEventsSection />
            </section>
          </div>
          <div className="flex flex-col gap-10">
            <section>
              <SectionHeader eyebrow="Méditation" title="Réflexion du jour" />
              <PastoralReflectionWidget />
            </section>
            <section>
              <SectionHeader
                eyebrow="Prière"
                title="Mes intentions"
                actionHref={paths.app.intentions.getHref()}
              />
              <MyIntentionsSection />
            </section>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
