'use client';

import { MapPinned } from 'lucide-react';

import { Card } from '@/components/ui/card/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useActivity, type Activity } from '../api/get-activity';
import type { AnalyticsFilters } from '../api/get-analytics';
import { formatXof } from '../utils/format';

type ActivityRow = Activity['rows'][number];

const GRAIN_LABEL: Record<Activity['grain'], string> = {
  church: 'église',
  parish: 'paroisse',
  diocese: 'diocèse',
};

const GRAIN_COLUMN_HEADER: Record<Activity['grain'], string> = {
  church: 'Église',
  parish: 'Paroisse',
  diocese: 'Diocèse',
};

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function SouffranceCard({
  title,
  pending,
  total,
  byStatus,
}: {
  title: string;
  pending: number;
  total: number;
  byStatus: Activity['documents']['by_status'];
}) {
  return (
    <Card variant="elevated" className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-2xl font-bold tabular-nums',
            pending > 0 ? 'text-warning' : 'text-foreground',
          )}
        >
          {pending}
        </span>
        <span className="text-xs text-muted-foreground">
          en attente · {total} au total
        </span>
      </p>
      {byStatus.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {byStatus.map((s) => (
            <span
              key={s.status}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {s.label}
              <span className="font-semibold text-foreground">{s.count}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Cellule « pending » : chiffre en alerte (warning) dès qu'une file existe. */
function PendingCell({ value }: { value: number | null }) {
  return (
    <span
      className={cn(
        'text-sm tabular-nums',
        (value ?? 0) > 0
          ? 'font-semibold text-warning'
          : 'text-muted-foreground',
      )}
    >
      {value ?? '—'}
    </span>
  );
}

export function ActivitySection({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading, isError, refetch } = useActivity(filters);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Impossible de charger l'activité"
        description="Une erreur est survenue lors de la récupération de la matrice d'activité."
        onRetry={() => refetch()}
      />
    );
  }

  const showQueues = data.grain !== 'church';

  const columns: DataTableColumn<ActivityRow>[] = [
    {
      header: GRAIN_COLUMN_HEADER[data.grain],
      mobileLabel: 'Nom',
      headClassName: TH_CLASS,
      cell: (r) => {
        const inactive =
          r.donations_total === 0 &&
          r.fideles === 0 &&
          (r.documents_pending ?? 0) === 0 &&
          (r.intentions_pending ?? 0) === 0;
        return (
          <span className="inline-flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium',
                inactive ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {r.name ?? '—'}
            </span>
            {inactive && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                sans activité
              </span>
            )}
          </span>
        );
      },
    },
    {
      header: 'Dons',
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (r) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatXof(r.donations_total, true)}
        </span>
      ),
    },
    {
      header: 'Fidèles',
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (r) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {r.fideles}
        </span>
      ),
    },
    ...(showQueues
      ? ([
          {
            header: 'Docs en attente',
            mobileLabel: 'Docs',
            headClassName: cn(TH_CLASS, 'text-right'),
            className: 'text-right',
            cell: (r) => <PendingCell value={r.documents_pending} />,
          },
          {
            header: 'Intentions en attente',
            mobileLabel: 'Intentions',
            headClassName: cn(TH_CLASS, 'text-right'),
            className: 'text-right',
            cell: (r) => <PendingCell value={r.intentions_pending} />,
          },
        ] satisfies DataTableColumn<ActivityRow>[])
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <SouffranceCard
          title="Documents en attente"
          pending={data.documents.pending}
          total={data.documents.total}
          byStatus={data.documents.by_status}
        />
        <SouffranceCard
          title="Intentions de messe en attente"
          pending={data.intentions.pending}
          total={data.intentions.total}
          byStatus={data.intentions.by_status}
        />
      </div>

      <div>
        <SectionHeader
          as="h3"
          hairline={false}
          title={`Matrice d'activité par ${GRAIN_LABEL[data.grain]}`}
          className="mb-3"
        />
        <DataTable
          data={data.rows}
          columns={columns}
          rowKey={(r) => r.id ?? r.name ?? '—'}
          caption={`Matrice d'activité par ${GRAIN_LABEL[data.grain]}`}
          emptyState={
            <EmptyState
              icon={<MapPinned aria-hidden="true" />}
              title="Aucune activité sur la période"
              description="Aucune entité de votre périmètre n'a enregistré de dons, de fidèles ou de files d'attente sur la période sélectionnée. Élargissez la période pour voir plus loin."
            />
          }
        />
      </div>
    </div>
  );
}
