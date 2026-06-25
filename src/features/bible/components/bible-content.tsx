'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card/card';
import { ScriptureQuote } from '@/components/ui/scripture-quote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BibleBooksTab } from './bible-books-tab';
import { HeuresTab } from './heures-tab';
import { LectioDivina } from './lectio-divina';
import { MasseTab } from './masse-tab';
import { ReadingPlanList } from './reading-plan-list';
import { TodayTab } from './today-tab';

const VALID_TABS = ['aujourdhui', 'bible', 'messe', 'heures', 'lectio', 'parcours'] as const;
type TabValue = (typeof VALID_TABS)[number];

function resolveTab(tab: string | null): TabValue {
  if (tab && (VALID_TABS as readonly string[]).includes(tab)) {
    return tab as TabValue;
  }
  return 'aujourdhui';
}

export function BibleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = resolveTab(searchParams.get('tab'));

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/app/bible?${params.toString()}`);
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Bible & Liturgie"
        subtitle="Parole de Dieu au quotidien"
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Citation d'ouverture éditoriale — pose le ton « Revue Sacrée ». */}
        <ScriptureQuote
          eyebrow="Parole de Dieu"
          text="Au commencement était le Verbe, et le Verbe était Dieu."
          reference="Jean 1, 1"
          size="md"
          className="mb-6"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-5 w-full overflow-x-auto flex-nowrap justify-between">
            <TabsTrigger value="aujourdhui">Aujourd&apos;hui</TabsTrigger>
            <TabsTrigger value="bible">Bible</TabsTrigger>
            <TabsTrigger value="messe">Messe</TabsTrigger>
            <TabsTrigger value="heures">Heures</TabsTrigger>
            <TabsTrigger value="lectio">Lectio</TabsTrigger>
            <TabsTrigger value="parcours">Parcours</TabsTrigger>
          </TabsList>

          <TabsContent value="aujourdhui">
            <TodayTab />
          </TabsContent>
          <TabsContent value="bible">
            <BibleBooksTab />
          </TabsContent>
          <TabsContent value="messe">
            <MasseTab />
          </TabsContent>
          <TabsContent value="heures">
            <HeuresTab />
          </TabsContent>
          <TabsContent value="lectio">
            <div className="space-y-4">
              <Card variant="sacred">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Lectio Divina
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Méditez la Parole en 4 étapes. Sélectionnez un passage depuis l&apos;onglet
                    Bible pour démarrer une session sur ce texte précis, ou utilisez le passage du
                    jour (id&nbsp;0 = liturgie du jour).
                  </p>
                </CardContent>
              </Card>
              <LectioDivina passageId={0} />
            </div>
          </TabsContent>
          <TabsContent value="parcours">
            <ReadingPlanList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
