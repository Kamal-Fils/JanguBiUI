'use client';

import { AlertTriangle, Church, FileText, Users, Wallet } from 'lucide-react';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';

import { useMyDioceseDashboard } from '../api/get-diocese-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

type StatTone = 'primary' | 'gold' | 'success' | 'info';

/** Consolidation diocésaine de l'évêque (paroisses, fidèles, dons, alerte qualité). */
export function DioceseStatsSection() {
  const { data, isLoading, isError } = useMyDioceseDashboard();

  if (isError) return null;
  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />;
  if (!data) return null;

  const stats: Array<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    tone: StatTone;
  }> = [
    {
      label: 'Paroisses',
      value: data.parishes_count,
      icon: <Church />,
      tone: 'gold',
    },
    {
      label: 'Fidèles',
      value: data.total_fideles.toLocaleString('fr-FR'),
      icon: <Users />,
      tone: 'primary',
    },
    {
      label: 'Dons',
      value: formatXof(data.donations_total),
      icon: <Wallet />,
      tone: 'success',
    },
    {
      label: 'Documents',
      value: data.pending_documents,
      icon: <FileText />,
      tone: 'info',
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        Mon diocèse — {data.diocese.name}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            tone={stat.tone}
          />
        ))}
      </div>

      {data.parishes_without_main_church > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          {data.parishes_without_main_church} paroisse(s) sans église principale —
          à corriger.
        </div>
      )}
    </section>
  );
}
