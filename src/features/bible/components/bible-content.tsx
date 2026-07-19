'use client';

import { useSearchParams } from 'next/navigation';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { SectionHeader } from '@/components/ui/section-header';

import { BibleBooksTab } from './bible-books-tab';
import { BibleOpeningQuote } from './bible-opening-quote';
import { LectioDivina } from './lectio-divina';
import { ReadingPlanList } from './reading-plan-list';

// Vues internes de la page Bible, pilotées par l'URL (`?tab=`) — retours
// testeurs n°2 : la barre d'onglets interne est supprimée, la sous-nav
// « Spiritualité » de la sidebar (src/config/nav-config.ts) porte les entrées
// « Bible » (défaut), « Lectio divina » (?tab=lectio) et « Parcours de
// lecture » (?tab=parcours). Les anciens onglets « Aujourd'hui / Messe /
// Heures » dupliquaient les pages dédiées /app/spirituel/liturgie et
// /app/spirituel/heures, déjà servies par la sidebar : ils disparaissent.
const VALID_TABS = ['bible', 'lectio', 'parcours'] as const;
type TabValue = (typeof VALID_TABS)[number];

const DEFAULT_TAB: TabValue = 'bible';

function resolveTab(tab: string | null): TabValue {
  if (tab && (VALID_TABS as readonly string[]).includes(tab)) {
    return tab as TabValue;
  }
  return DEFAULT_TAB;
}

function LectioView() {
  return (
    <div className="space-y-5">
      <BibleOpeningQuote />
      <SectionHeader
        eyebrow="Lectio Divina"
        title="Méditer la Parole en quatre temps"
        description="Lisez, méditez, priez, contemplez. Sélectionnez un passage depuis la Bible pour démarrer une session sur ce texte précis, ou méditez le passage du jour."
      />
      {/* Lectio « du jour » : aucun verset rattaché (le 0 précédent était une
          sentinelle que le serveur interprétait comme un verset introuvable). */}
      <LectioDivina passageId={null} />
    </div>
  );
}

function ParcoursView() {
  return (
    <div className="space-y-5">
      <BibleOpeningQuote />
      <SectionHeader
        eyebrow="Parcours de lecture"
        title="Lire la Bible dans la durée"
        description="Un parcours propose un rythme de lecture jour après jour. Inscrivez-vous pour le suivre à votre main."
      />
      <ReadingPlanList />
    </div>
  );
}

export function BibleContent() {
  const searchParams = useSearchParams();

  const activeTab = resolveTab(searchParams.get('tab'));

  // Titre + app-bar fournis par le shell (AppHeader) — retour testeurs n°7.
  useRegisterPageMeta({
    title: 'Bible',
    subtitle: 'Parole de Dieu au quotidien',
  });

  return (
    // Le CADRE de page reste en largeur `default` : c'est la recette commune de
    // l'app. La mesure de lecture (~68ch) n'est PAS portée ici — elle est posée
    // sur la seule colonne de TEXTE, dans `ChapterReading`. Contraindre la page
    // entière laissait deux bandes mortes de part et d'autre (« trop de marge
    // auto qui centre le composant »).
    <ContentContainer className="pb-20">
      {activeTab === 'bible' && <BibleBooksTab />}
      {activeTab === 'lectio' && <LectioView />}
      {activeTab === 'parcours' && <ParcoursView />}
    </ContentContainer>
  );
}
