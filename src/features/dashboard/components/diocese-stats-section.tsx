'use client';

import { AlertTriangle, Church, FileText, Users, Wallet } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useMyDioceseDashboard } from '../api/get-diocese-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/** Consolidation diocésaine de l'évêque (paroisses, fidèles, dons, alerte qualité). */
export function DioceseStatsSection() {
  const { data, isLoading, isError } = useMyDioceseDashboard();

  if (isError) return null;
  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />;
  if (!data) return null;

  const stats: Array<{ label: string; value: string | number; icon: typeof Users; color: string }> = [
    { label: 'Paroisses', value: data.parishes_count, icon: Church, color: 'text-amber-600' },
    {
      label: 'Fidèles',
      value: data.total_fideles.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Dons',
      value: formatXof(data.donations_total),
      icon: Wallet,
      color: 'text-emerald-600',
    },
    { label: 'Documents', value: data.pending_documents, icon: FileText, color: 'text-blue-600' },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        Mon diocèse — {data.diocese.name}
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

      {data.parishes_without_main_church > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="size-4 flex-shrink-0" />
          {data.parishes_without_main_church} paroisse(s) sans église principale — à corriger.
        </div>
      )}
    </section>
  );
}
