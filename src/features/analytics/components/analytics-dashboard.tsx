'use client';

import {
  BarChart3,
  Church,
  HeartHandshake,
  Landmark,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { useAnalytics, type AnalyticsFilters } from '../api/get-analytics';
import { formatXof } from '../utils/format';

import { ActivitySection } from './activity-section';

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

const ACTIVE_UNITS_LABEL: Record<string, string> = {
  church: 'Églises actives · avec dons',
  parish: 'Paroisses actives · avec dons',
  diocese: 'Diocèses actifs · avec dons',
};

/** Variation vs période précédente, colorée sémantiquement (hausse/baisse). */
function DeltaPill({ delta }: { delta: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        delta >= 0 ? 'text-success' : 'text-destructive',
      )}
    >
      {delta >= 0 ? (
        <TrendingUp className="size-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3" aria-hidden="true" />
      )}
      {delta >= 0 ? '+' : ''}
      {delta}%
    </span>
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
  const { data, isLoading, isError, error, refetch } = useAnalytics(filters);

  useRegisterPageMeta({
    title: 'Analytique',
    subtitle: 'Flux de dons et de fidèles sur votre périmètre',
    backHref: paths.app.clerge.root.getHref(),
  });

  const set = (patch: Partial<AnalyticsFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  // 403 = clergé sans périmètre territorial : cas fonctionnel (état vide
  // explicatif), pas une erreur technique. Les autres erreurs → retry.
  const isForbidden = error instanceof ApiError && error.status === 403;

  if (isError && isForbidden) {
    return (
      <ContentContainer width="wide">
        <EmptyState
          icon={<BarChart3 aria-hidden="true" />}
          title="Analytique indisponible"
          description="Le tableau de bord analytique est réservé aux responsables d'un périmètre (curé, évêque, archevêque)."
        />
      </ContentContainer>
    );
  }

  if (isError) {
    return (
      <ContentContainer width="wide">
        <ErrorState
          title="Impossible de charger l'analytique"
          description="Une erreur est survenue lors de la récupération des données."
          onRetry={() => refetch()}
        />
      </ContentContainer>
    );
  }

  const k = data?.kpis;

  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-7">
        {/* Vue d'ensemble : filtres + KPIs */}
        <section aria-label="Vue d'ensemble">
          <SectionHeader
            eyebrow="Pilotage"
            title="Vue d'ensemble"
            description={
              data?.entity
                ? `${LEVEL_LABEL[data.level]} · ${data.entity.name}`
                : undefined
            }
          />

          {/* Filtres */}
          <div className="mb-5 flex flex-col gap-3">
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
                  className="rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ↑ Remonter
                </button>
              )}
            </div>
          </div>

          {/* KPIs — tuiles StatCard unifiées */}
          {isLoading || !k || !data ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={<HeartHandshake />}
                tone="gold"
                value={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    {formatXof(k.donations_total)}
                    {k.delta_pct != null && <DeltaPill delta={k.delta_pct} />}
                  </span>
                }
                label={`Dons confirmés · ${k.donations_count} don${
                  k.donations_count !== 1 ? 's' : ''
                }`}
              />
              <StatCard
                icon={<Users />}
                tone="info"
                value={new Intl.NumberFormat('fr-FR').format(k.fideles)}
                label={
                  k.fideles_new
                    ? `Fidèles · +${k.fideles_new} nouveaux`
                    : 'Fidèles sur la période'
                }
              />
              <StatCard
                icon={<Landmark />}
                tone="primary"
                value={`${k.denier_rate}%`}
                label="Taux Denier · part structurelle"
              />
              <StatCard
                icon={<Church />}
                tone="success"
                value={`${k.active_units}/${k.total_units}`}
                label={ACTIVE_UNITS_LABEL[data.ranking_level]}
              />
            </div>
          )}
        </section>

        {/* Graphiques */}
        <section aria-label="Flux de dons">
          <SectionHeader
            eyebrow="Tendances"
            title="Flux de dons"
            description="Évolution, répartition par type et classement territorial."
          />
          {isLoading || !data ? (
            <ChartsSkeleton />
          ) : (
            <AnalyticsCharts data={data} />
          )}
        </section>

        {/* Matrice d'activité + files en souffrance (incrément 2) */}
        {!isLoading && data && (
          <section aria-label="Activité du périmètre">
            <SectionHeader
              eyebrow="Suivi"
              title="Activité du périmètre"
              description="Files d'attente et vitalité de chaque entité."
            />
            <ActivitySection filters={filters} />
          </section>
        )}
      </div>
    </ContentContainer>
  );
}
