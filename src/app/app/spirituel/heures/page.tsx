'use client';

import { useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import type { OfficeKey } from '@/features/spirituel/api/get-office';
import { OfficeSelector } from '@/features/spirituel/components/liturgie-heures/office-selector';
import { OfficeView } from '@/features/spirituel/components/liturgie-heures/office-view';

function getCurrentOfficeKey(): OfficeKey {
  const hour = new Date().getHours();
  if (hour < 6) return 'lectures';
  if (hour < 9) return 'laudes';
  if (hour < 12) return 'tierce';
  if (hour < 15) return 'sexte';
  if (hour < 18) return 'none';
  if (hour < 21) return 'vepres';
  return 'complies';
}

export default function LiturgieHeuresPage() {
  const [selectedOffice, setSelectedOffice] =
    useState<OfficeKey>(getCurrentOfficeKey);

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Liturgie des Heures"
          subtitle="Les 7 offices de la prière quotidienne"
        />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          <div className="mb-6">
            <OfficeSelector
              selected={selectedOffice}
              onChange={setSelectedOffice}
            />
          </div>
          <OfficeView officeKey={selectedOffice} />
        </div>
      </div>
    </AppShell>
  );
}
