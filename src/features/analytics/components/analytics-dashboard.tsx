'use client';

import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useAnalytics, type AnalyticsFilters } from '../api/get-analytics';
import { formatXof } from '../utils/format';

const ChartsSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-3">
    <Skeleton className="h-[280px] lg:col-span-2" />
    <Skeleton className="h-[280px]" />
  </div>
);

const AnalyticsCharts = dynamic(() => import('./analytics-charts'), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Année' },
];
const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];
const TYPE_OPTIONS = [
  { value: '', label: 'Tous types' },
  { value: 'church_tithe', label: 'Denier' },
  { value: 'sunday_collection', label: 'Quête' },
  { value: 'mass_intention_offering', label: 'Offrande messe' },
  { value: 'special_project', label: 'Projet' },
  { value: 'free_donation', label: 'Don libre' },
];
const PROVIDER_OPTIONS = [
  { value: '', label: 'Tous moyens' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'cash', label: 'Espèces' },
];

const LEVEL_LABEL: Record<string, string> = {
  parish: 'Paroisse',
  diocese: 'Diocèse',
  province: 'Province',
};

function Kpi({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
}) {
  return (
    <Card variant="elevated" className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs">
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              delta >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {delta >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </Card>
  );
}

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'year',
    granularity: 'month',
  });
  const { data, isLoading, isError } = useAnalytics(filters);

  useRegisterPageMeta({
    title: 'Analytique',
    subtitle: 'Flux de dons et de fidèles sur votre périmètre',
  });

  const set = (patch: Partial<AnalyticsFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  if (isError) {
    return (
      <ContentContainer width="wide">
        <EmptyState
          icon={<BarChart3 />}
          title="Analytique indisponible"
          description="Le tableau de bord analytique est réservé aux responsables d'un périmètre (curé, évêque, archevêque)."
        />
      </ContentContainer>
    );
  }

  const k = data?.kpis;

  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-6">
        {/* Filtres */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPills
              options={PERIOD_OPTIONS}
              value={filters.period ?? 'year'}
              onChange={(v) => set({ period: v })}
              ariaLabel="Période"
            />
            <span className="hidden text-border sm:inline">·</span>
            <FilterPills
              options={GRANULARITY_OPTIONS}
              value={filters.granularity ?? 'month'}
              onChange={(v) => set({ granularity: v })}
              ariaLabel="Granularité"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              ariaLabel="Type de don"
              value={filters.type ?? ''}
              onChange={(v) => set({ type: v || undefined })}
              options={TYPE_OPTIONS}
            />
            <Select
              ariaLabel="Moyen de paiement"
              value={filters.provider ?? ''}
              onChange={(v) => set({ provider: v || undefined })}
              options={PROVIDER_OPTIONS}
            />
            {/* Drill-down spatial : on descend dans une sous-entité du périmètre
                (diocèse→paroisse, province→diocèse). Au grain « église » (curé)
                il n'y a plus de descente → on n'affiche pas le sélecteur. */}
            {data &&
              data.ranking_level !== 'church' &&
              data.ranking.length > 0 && (
                <Select
                  ariaLabel="Zoom géographique"
                  value={String(filters.parish ?? filters.diocese ?? '')}
                  onChange={(v) => {
                    const id = v ? Number(v) : undefined;
                    if (data.ranking_level === 'parish')
                      set({ parish: id, diocese: undefined });
                    else set({ diocese: id, parish: undefined });
                  }}
                  options={[
                    {
                      value: '',
                      label:
                        data.ranking_level === 'parish'
                          ? 'Toutes paroisses'
                          : 'Tous diocèses',
                    },
                    ...data.ranking.map((r) => ({
                      value: String(r.id),
                      label: r.name ?? '—',
                    })),
                  ]}
                />
              )}
            {(filters.parish || filters.diocese) && (
              <button
                type="button"
                onClick={() => set({ parish: undefined, diocese: undefined })}
                className="rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ↑ Remonter
              </button>
            )}
            {data?.entity && (
              <span className="ml-auto text-sm text-muted-foreground">
                {LEVEL_LABEL[data.level]} · {data.entity.name}
              </span>
            )}
          </div>
        </div>

        {/* KPIs */}
        {isLoading || !k ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Dons confirmés"
              value={formatXof(k.donations_total)}
              delta={k.delta_pct}
              sub={`${k.donations_count} don${k.donations_count !== 1 ? 's' : ''}`}
            />
            <Kpi
              label="Fidèles"
              value={new Intl.NumberFormat('fr-FR').format(k.fideles)}
              sub={
                k.fideles_new ? `+${k.fideles_new} nouveaux` : 'sur la période'
              }
            />
            <Kpi
              label="Taux Denier"
              value={`${k.denier_rate}%`}
              sub="part structurelle"
            />
            <Kpi
              label={
                data.ranking_level === 'church'
                  ? 'Églises actives'
                  : data.ranking_level === 'parish'
                    ? 'Paroisses actives'
                    : 'Diocèses actifs'
              }
              value={`${k.active_units}/${k.total_units}`}
              sub="avec dons sur la période"
            />
          </div>
        )}

        {/* Graphiques */}
        {isLoading || !data ? (
          <ChartsSkeleton />
        ) : (
          <AnalyticsCharts data={data} />
        )}
      </div>
    </ContentContainer>
  );
}
