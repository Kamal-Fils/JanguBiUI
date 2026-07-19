'use client';

import { Church } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MetricStrip, type WorkMetric } from '@/components/ui/metric-strip';
import { ApiError } from '@/lib/api-client';

import { useMyParishDashboard } from '../api/get-parish-dashboard';


function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

const NUMBER_FR = new Intl.NumberFormat('fr-FR');

/**
 * Synthèse paroissiale du curé — archétype **Travail** (DIRECTION R6).
 *
 * Le bloc renvoyait `null` sur erreur : une panne réseau se lisait comme
 * « cette paroisse n'a rien à dire », une zone blanche sans explication ni
 * moyen de réessayer. On distingue désormais deux cas très différents :
 *
 * - **404** — le compte n'est rattaché à aucune paroisse. C'est fonctionnel,
 *   pas une panne : on l'explique, sans bouton « Réessayer » qui ne peut rien
 *   changer.
 * - **toute autre erreur** — c'est une panne : message explicite + reprise.
 */
export function ParishStatsSection() {
  const { data, isLoading, isError, error, refetch } = useMyParishDashboard();

  const isNotFound = error instanceof ApiError && error.status === 404;

  if (isError && isNotFound) {
    return (
      <section aria-label="Ma paroisse">
        <EmptyState
          icon={<Church aria-hidden="true" />}
          title="Aucune paroisse rattachée"
          description="Votre compte n'est rattaché à aucune paroisse : les statistiques paroissiales apparaîtront dès qu'un rattachement sera enregistré."
        />
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-label="Ma paroisse">
        <ErrorState
          title="Statistiques paroissiales indisponibles"
          description="Les chiffres de votre paroisse n'ont pas pu être chargés."
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  const metrics: WorkMetric[] = [
    {
      label: 'Fidèles',
      value: NUMBER_FR.format(data?.total_fideles ?? 0),
    },
    {
      label: 'Dons (année)',
      value: formatXof(data?.donation_flow_year.total ?? 0),
    },
    {
      label: 'Documents en attente',
      value: data?.pending_documents ?? 0,
      alert: (data?.pending_documents ?? 0) > 0,
    },
    {
      label: 'Intentions en attente',
      value: data?.pending_intentions ?? 0,
      alert: (data?.pending_intentions ?? 0) > 0,
    },
  ];

  const byType = data?.donation_flow_year.by_type ?? [];

  return (
    <section aria-labelledby="parish-stats-title" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
        <h2
          id="parish-stats-title"
          className="text-sm font-semibold text-foreground"
        >
          Ma paroisse{data ? ` — ${data.parish.name}` : ''}
        </h2>
      </div>

      <MetricStrip items={metrics} isLoading={isLoading} />

      {byType.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <h3 className="border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            Flux de dons par type (année)
          </h3>
          <ul className="divide-y divide-border">
            {byType.map((row) => (
              <li
                key={row.donation_type}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-foreground">
                  {row.donation_type}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
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
