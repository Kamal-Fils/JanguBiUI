'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { FideleSummarySection } from '@/features/dashboard/components/fidele-summary-section';
import { ModuleShortcuts } from '@/features/home/module-shortcuts';
import { WordOfTheDay } from '@/features/home/word-of-the-day';
import { PastoralReflectionWidget } from '@/features/reflexion-pastorale/components/pastoral-reflection-widget';

import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';

/**
 * Accueil du fidèle.
 *
 * Le trajet, dans l'ordre où on le lit :
 *
 * 1. **La Parole du jour** — le geste quotidien qui fait revenir, en pleine
 *    échelle et en bleu.
 * 2. **Mon espace** — où j'en suis (demandes, dons) et, juste dessous, tout ce
 *    que l'application sait faire. C'est là que se joue la différence avec une
 *    app de lectures : demander un acte, écrire à son curé, confier une
 *    intention. Placé haut exprès — un avantage qu'on ne voit pas n'existe pas.
 * 3. **La vie de la communauté**, puis ce qui appartient en propre au fidèle
 *    (sa méditation, ses intentions).
 *
 * L'ancienne bannière de bienvenue — un bloc dégradé portant le prénom en très
 * grand — a cédé la place : elle occupait la position de force pour une
 * information sans valeur d'usage.
 *
 * Comme les tableaux de bord du clergé, cet écran vit dans la **couche app** :
 * il agrège cinq features distinctes (dashboard, réflexion pastorale, actus,
 * agenda, intentions). Composer cet assemblage depuis `features/home` imposait
 * des imports croisés, ce que l'architecture interdit ; seule la couche app a
 * le droit d'importer n'importe quelle feature.
 */
export function FideleDashboard() {
  return (
    <ContentContainer>
      <div className="flex flex-col gap-10">
        <WordOfTheDay />

        <section>
          <SectionHeader
            eyebrow="Tout au même endroit"
            title="Mon espace"
            description="Vos démarches, votre paroisse et votre prière — sans changer d’application."
          />
          <div className="flex flex-col gap-4">
            <FideleSummarySection />
            <ModuleShortcuts />
          </div>
        </section>

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
