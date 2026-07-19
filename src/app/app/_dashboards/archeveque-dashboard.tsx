'use client';

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { ErrorState } from '@/components/ui/error-state';
import {
  MetricStrip,
  type WorkMetric,
} from '@/components/ui/metric-strip';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import {
  useMyProvinceDashboard,
  type DioceseSummary,
} from '@/features/dashboard/api/get-province-dashboard';
import { cn } from '@/utils/cn';

import {
  TodayQueue,
  WorkEmpty,
  WorkHeader,
  WorkSection,
  type WorkTask,
} from './work-shell';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

const NUMBER_FR = new Intl.NumberFormat('fr-FR');

// ── Tableau des diocèses ─────────────────────────────────────────────────────

/**
 * Une ligne par diocèse, colonnes alignées et chiffres en `tabular-nums` : la
 * comparaison entre diocèses est le seul geste que fait vraiment un archevêque
 * sur cet écran. Les cartes précédentes empilaient les mêmes valeurs à des
 * abscisses différentes — impossible de comparer sans relire chaque ligne.
 */
function DioceseRow({ diocese }: { diocese: DioceseSummary }) {
  const isLate = diocese.pending_documents > 0;

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-1.5 border-l-4 bg-card px-3 py-3 sm:px-4',
        isLate ? 'border-warning' : 'border-transparent',
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {diocese.name}
      </span>

      <span className="text-xs text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">
          {NUMBER_FR.format(diocese.parishes_count)}
        </span>{' '}
        paroisse{diocese.parishes_count > 1 ? 's' : ''}
      </span>

      <span className="text-xs text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">
          {NUMBER_FR.format(diocese.fideles_count)}
        </span>{' '}
        fidèle{diocese.fideles_count > 1 ? 's' : ''}
      </span>

      {/* Le retard est nommé, pas seulement coloré (WCAG 1.4.1, R4). */}
      <span
        className={cn(
          'text-xs font-medium tabular-nums',
          isLate ? 'text-warning' : 'text-muted-foreground',
        )}
      >
        {isLate
          ? `${diocese.pending_documents} document${diocese.pending_documents > 1 ? 's' : ''} en attente`
          : 'À jour'}
      </span>
    </li>
  );
}

// ── Écran ────────────────────────────────────────────────────────────────────

/**
 * Tableau de bord de l'archevêque — archétype **Travail** (DIRECTION R6),
 * scopé **province** (et non diocèse : retour d'audit Lot 4). Alimenté par
 * `GET /v1/dashboards/my-province/`.
 *
 * L'écran répond à une question de conduite : *où ça coince dans ma province ?*
 * D'où l'ordre — ce qui attend, puis le tableau comparatif des diocèses, puis
 * les agrégats. Le renvoi vers l'analytique reste en pied : c'est un
 * approfondissement, pas une tâche.
 */
export function ArchevequeDashboard() {
  const { data, isLoading, isError, refetch } = useMyProvinceDashboard();

  const tasks: WorkTask[] = [
    {
      label: { one: 'demande de document', many: 'demandes de documents' },
      count: data?.pending_documents ?? 0,
      href: paths.app.admin.documents.getHref(),
      isLoading,
    },
  ];

  const metrics: WorkMetric[] = [
    {
      label: 'Diocèses',
      value: NUMBER_FR.format(data?.dioceses_count ?? 0),
    },
    {
      label: 'Paroisses',
      value: NUMBER_FR.format(data?.parishes_count ?? 0),
      href: paths.app.admin.org.getHref(),
    },
    {
      label: 'Fidèles',
      value: NUMBER_FR.format(data?.total_fideles ?? 0),
    },
    {
      label: 'Dons (année)',
      value: formatXof(data?.donations_total_year ?? 0),
    },
  ];

  if (isError) {
    return (
      <ContentContainer>
        <div className="flex flex-col gap-7">
          <WorkHeader
            scope="Conduite de la province"
            title="Ma province aujourd'hui"
          />
          <ErrorState
            title="Vue provinciale indisponible"
            description="Impossible de charger la province. Vérifiez que votre compte y est bien rattaché, puis réessayez."
            onRetry={() => refetch()}
          />
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className="flex flex-col gap-7">
        <WorkHeader
          scope="Conduite de la province"
          title="Ma province aujourd'hui"
          entity={data?.province.name}
        />

        <TodayQueue tasks={tasks} />

        <WorkSection title="Mes diocèses" count={data?.dioceses.length}>
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : !data || data.dioceses.length === 0 ? (
            <WorkEmpty>Aucun diocèse rattaché à cette province.</WorkEmpty>
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
              {data.dioceses.map((diocese) => (
                <DioceseRow key={diocese.id} diocese={diocese} />
              ))}
            </ul>
          )}
        </WorkSection>

        <WorkSection title="Chiffres de la province">
          <MetricStrip items={metrics} isLoading={isLoading} />
        </WorkSection>

        <Link
          href={paths.app.clerge.analytique.getHref()}
          className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              Analytique provinciale
            </span>
            <span className="block text-xs text-muted-foreground">
              Flux de dons et de fidèles, par diocèse et par période.
            </span>
          </span>
          <BarChart3
            className="size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
        </Link>
      </div>
    </ContentContainer>
  );
}
