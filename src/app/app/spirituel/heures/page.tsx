'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import type { OfficeKey } from '@/features/spirituel/api/get-office';
import { OfficeSelector } from '@/features/spirituel/components/liturgie-heures/office-selector';
import { OfficeView } from '@/features/spirituel/components/liturgie-heures/office-view';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

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
  const { data: user } = useUser();
  const [selectedOffice, setSelectedOffice] =
    useState<OfficeKey>(getCurrentOfficeKey);

  if (user && !isClergy(user)) {
    return (
      <AppShell>
        <div className="flex flex-col">
          <PageHeader
            title="Liturgie des Heures"
            subtitle="Réservé au clergé et aux religieux"
          />
          <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
            <p className="text-muted-foreground">
              La Liturgie des Heures est réservée au clergé et aux religieux.
            </p>
            <Link
              href={paths.app.spirituel.getHref()}
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="size-4" />
              Retour à la Spiritualité
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

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
