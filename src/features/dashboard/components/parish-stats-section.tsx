'use client';

import { FileText, ScrollText, Users, Wallet } from 'lucide-react';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';

import { useMyParishDashboard } from '../api/get-parish-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

type StatTone = 'primary' | 'gold' | 'success' | 'info';

/**
 * Synthèse paroissiale du curé : total de fidèles + flux de dons + files d'attente.
 * Ne s'affiche que pour un prêtre rattaché à une paroisse (sinon l'endpoint renvoie 404).
 */
export function ParishStatsSection() {
  const { data, isLoading, isError } = useMyParishDashboard();

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
      label: 'Fidèles',
      value: data.total_fideles.toLocaleString('fr-FR'),
      icon: <Users />,
      tone: 'primary',
    },
    {
      label: 'Dons (année)',
      value: formatXof(data.donation_flow_year.total),
      icon: <Wallet />,
      tone: 'success',
    },
    {
      label: 'Documents',
      value: data.pending_documents,
      icon: <FileText />,
      tone: 'gold',
    },
    {
      label: 'Intentions',
      value: data.pending_intentions,
      icon: <ScrollText />,
      tone: 'info',
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        Ma paroisse — {data.parish.name}
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

      {data.donation_flow_year.by_type.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft-sm">
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
            Flux de dons par type (année)
          </h3>
          <ul className="flex flex-col gap-1">
            {data.donation_flow_year.by_type.map((row) => (
              <li
                key={row.donation_type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{row.donation_type}</span>
                <span className="font-medium tabular-nums">
                  {formatXof(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
