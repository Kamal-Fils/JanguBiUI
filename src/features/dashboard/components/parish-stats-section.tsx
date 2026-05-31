'use client';

import { FileText, ScrollText, Users, Wallet } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useMyParishDashboard } from '../api/get-parish-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/**
 * Synthèse paroissiale du curé : total de fidèles + flux de dons + files d'attente.
 * Ne s'affiche que pour un prêtre rattaché à une paroisse (sinon l'endpoint renvoie 404).
 */
export function ParishStatsSection() {
  const { data, isLoading, isError } = useMyParishDashboard();

  if (isError) return null;
  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />;
  if (!data) return null;

  const stats: Array<{ label: string; value: string | number; icon: typeof Users; color: string }> = [
    {
      label: 'Fidèles',
      value: data.total_fideles.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Dons (année)',
      value: formatXof(data.donation_flow_year.total),
      icon: Wallet,
      color: 'text-emerald-600',
    },
    {
      label: 'Documents',
      value: data.pending_documents,
      icon: FileText,
      color: 'text-amber-600',
    },
    {
      label: 'Intentions',
      value: data.pending_intentions,
      icon: ScrollText,
      color: 'text-blue-600',
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        Ma paroisse — {data.parish.name}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
            >
              <Icon className={cn('size-4', stat.color)} />
              <span className={cn('text-2xl font-bold tabular-nums', stat.color)}>
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {data.donation_flow_year.by_type.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
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
                <span className="font-medium tabular-nums">{formatXof(row.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
