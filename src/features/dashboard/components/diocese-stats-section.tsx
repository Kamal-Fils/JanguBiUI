'use client';

import { AlertTriangle, Landmark } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MetricStrip, type WorkMetric } from '@/components/ui/metric-strip';
import { ApiError } from '@/lib/api-client';

import { useMyDioceseDashboard } from '../api/get-diocese-dashboard';


function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

const NUMBER_FR = new Intl.NumberFormat('fr-FR');

/**
 * Consolidation diocésaine de l'évêque — archétype **Travail** (DIRECTION R6).
 *
 * Comme la synthèse paroissiale, le bloc disparaissait silencieusement en cas
 * d'erreur. Il distingue désormais le rattachement manquant (404, fonctionnel)
 * de la panne (reprise possible).
 */
export function DioceseStatsSection() {
  const { data, isLoading, isError, error, refetch } = useMyDioceseDashboard();

  const isNotFound = error instanceof ApiError && error.status === 404;

  if (isError && isNotFound) {
    return (
      <section aria-label="Mon diocèse">
        <EmptyState
          icon={<Landmark aria-hidden="true" />}
          title="Aucun diocèse rattaché"
          description="Votre compte n'est rattaché à aucun diocèse : la consolidation diocésaine apparaîtra dès qu'un rattachement sera enregistré."
        />
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-label="Mon diocèse">
        <ErrorState
          title="Consolidation diocésaine indisponible"
          description="Les chiffres de votre diocèse n'ont pas pu être chargés."
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  const metrics: WorkMetric[] = [
    {
      label: 'Paroisses',
      value: NUMBER_FR.format(data?.parishes_count ?? 0),
    },
    {
      label: 'Fidèles',
      value: NUMBER_FR.format(data?.total_fideles ?? 0),
    },
    {
      label: 'Dons',
      value: formatXof(data?.donations_total ?? 0),
    },
    {
      label: 'Documents en attente',
      value: data?.pending_documents ?? 0,
      alert: (data?.pending_documents ?? 0) > 0,
    },
  ];

  const withoutMainChurch = data?.parishes_without_main_church ?? 0;

  return (
    <section
      aria-labelledby="diocese-stats-title"
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
        <h2
          id="diocese-stats-title"
          className="text-sm font-semibold text-foreground"
        >
          Mon diocèse{data ? ` — ${data.diocese.name}` : ''}
        </h2>
      </div>

      <MetricStrip items={metrics} isLoading={isLoading} />

      {withoutMainChurch > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-semibold tabular-nums">
              {withoutMainChurch}
            </span>{' '}
            paroisse{withoutMainChurch > 1 ? 's' : ''} sans église principale —
            à corriger.
          </span>
        </p>
      )}
    </section>
  );
}
