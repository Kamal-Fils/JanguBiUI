'use client';

import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useActivity, type Activity } from '../api/get-activity';
import type { AnalyticsFilters } from '../api/get-analytics';
import { formatXof } from '../utils/format';

const GRAIN_LABEL: Record<Activity['grain'], string> = {
  church: 'église',
  parish: 'paroisse',
  diocese: 'diocèse',
};

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
            'text-2xl font-bold',
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

export function ActivitySection({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useActivity(filters);

  if (isLoading || !data) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const showQueues = data.grain !== 'church';

  return (
    <div className="flex flex-col gap-4">
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

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold capitalize text-foreground">
          Matrice d&apos;activité par {GRAIN_LABEL[data.grain]}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium capitalize">
                  {GRAIN_LABEL[data.grain]}
                </th>
                <th className="px-3 py-2 text-right font-medium">Dons</th>
                <th className="px-3 py-2 text-right font-medium">Fidèles</th>
                {showQueues && (
                  <>
                    <th className="px-3 py-2 text-right font-medium">Docs</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Intentions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const inactive =
                  r.donations_total === 0 &&
                  r.fideles === 0 &&
                  (r.documents_pending ?? 0) === 0 &&
                  (r.intentions_pending ?? 0) === 0;
                return (
                  <tr
                    key={r.id ?? r.name}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          'font-medium',
                          inactive
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {r.name ?? '—'}
                      </span>
                      {inactive && (
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          sans activité
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {formatXof(r.donations_total, true)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {r.fideles}
                    </td>
                    {showQueues && (
                      <>
                        <td
                          className={cn(
                            'px-3 py-2 text-right tabular-nums',
                            (r.documents_pending ?? 0) > 0
                              ? 'font-semibold text-warning'
                              : 'text-muted-foreground',
                          )}
                        >
                          {r.documents_pending ?? '—'}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 text-right tabular-nums',
                            (r.intentions_pending ?? 0) > 0
                              ? 'font-semibold text-warning'
                              : 'text-muted-foreground',
                          )}
                        >
                          {r.intentions_pending ?? '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
