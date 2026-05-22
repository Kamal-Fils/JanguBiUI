'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layouts/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BibleBooksTab } from './bible-books-tab';
import { HeuresTab } from './heures-tab';
import { MasseTab } from './masse-tab';
import { TodayTab } from './today-tab';

const VALID_TABS = ['aujourdhui', 'bible', 'messe', 'heures'] as const;
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
      <div className="mx-auto w-full max-w-3xl p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="aujourdhui" className="flex-1">
              Aujourd&apos;hui
            </TabsTrigger>
            <TabsTrigger value="bible" className="flex-1">
              Bible
            </TabsTrigger>
            <TabsTrigger value="messe" className="flex-1">
              Messe
            </TabsTrigger>
            <TabsTrigger value="heures" className="flex-1">
              Heures
            </TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
