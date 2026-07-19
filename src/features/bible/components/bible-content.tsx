'use client';

import { useSearchParams } from 'next/navigation';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Card, CardContent } from '@/components/ui/card/card';
import { ScriptureQuote } from '@/components/ui/scripture-quote';

import { BibleBooksTab } from './bible-books-tab';
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
    <div className="space-y-4">
      <Card variant="sacred">
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Lectio Divina
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Méditez la Parole en 4 étapes. Sélectionnez un passage depuis la
            Bible pour démarrer une session sur ce texte précis, ou utilisez le
            passage du jour (id&nbsp;0 = liturgie du jour).
          </p>
        </CardContent>
      </Card>
      <LectioDivina passageId={0} />
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
    <div className="flex flex-col">
      <ContentContainer>
        {/* Citation d'ouverture éditoriale — pose le ton « Revue Sacrée ». */}
        <ScriptureQuote
          eyebrow="Parole de Dieu"
          text="Au commencement était le Verbe, et le Verbe était Dieu."
          reference="Jean 1, 1"
          size="md"
          className="mb-6"
        />

        {activeTab === 'bible' && <BibleBooksTab />}
        {activeTab === 'lectio' && <LectioView />}
        {activeTab === 'parcours' && <ReadingPlanList />}
      </ContentContainer>
    </div>
  );
}
