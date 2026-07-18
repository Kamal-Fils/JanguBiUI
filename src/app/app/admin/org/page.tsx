'use client';

import { Building2, MapPin, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { CreateDioceseDialog } from '@/components/org/create-diocese-dialog';
import { CreateParishDialog } from '@/components/org/create-parish-dialog';
import { CreateProvinceDialog } from '@/components/org/create-province-dialog';
import { DioceseActions } from '@/components/org/diocese-actions';
import { ParishActions } from '@/components/org/parish-actions';
import { ProvinceActions } from '@/components/org/province-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { isSuperAdmin } from '@/lib/authorization';
import { useDioceses } from '@/lib/org/get-dioceses';
import { useParishes } from '@/lib/org/get-parishes';
import { useProvinces } from '@/lib/org/get-provinces';
import { cn } from '@/lib/utils';
import type { Diocese, Parish, Province } from '@/types/org';

const PAGE_SIZE = 20;

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-2/3 rounded-lg" />
      <Skeleton className="h-8 w-1/2 rounded-lg" />
    </div>
  );
}

function ProvincesSection({
  provinces,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
}: {
  provinces: Province[];
  selectedId?: number;
  onSelect: (id?: number) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  // Mode « Gérer » : révèle la liste d'administration (édition/suppression)
  // sous les pastilles SANS toucher au comportement de filtre.
  const [managing, setManaging] = useState(false);

  const options = [
    { value: '', label: 'Toutes' },
    ...provinces.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <Card variant="sacred">
      <CardContent className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Niveau 1"
          title="Provinces"
          action={
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={managing}
                icon={<Settings2 className="size-4" />}
                onClick={() => setManaging((v) => !v)}
              >
                Gérer
              </Button>
              <CreateProvinceDialog />
            </div>
          }
        />
        {isLoading ? (
          <SectionSkeleton />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les provinces"
            onRetry={onRetry}
          />
        ) : (
          <>
            <FilterPills
              options={options}
              value={selectedId ? String(selectedId) : ''}
              onChange={(v) => onSelect(v ? Number(v) : undefined)}
              ariaLabel="Filtrer par province"
            />
            {managing &&
              (provinces.length === 0 ? (
                <EmptyState
                  icon={<Building2 />}
                  title="Aucune province"
                  description="Créez la première province via « Nouvelle province »."
                />
              ) : (
                <ul
                  aria-label="Gestion des provinces"
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                >
                  {provinces.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background-surface px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.code}
                          {p.country ? ` · ${p.country}` : ''}
                        </p>
                      </div>
                      <ProvinceActions province={p} />
                    </li>
                  ))}
                </ul>
              ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DiocesesSection({
  dioceses,
  provinceId,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
}: {
  dioceses: Diocese[];
  /** Province filtrée en amont — présélectionnée dans le dialogue de création. */
  provinceId?: number;
  selectedId?: number;
  onSelect: (id?: number) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card variant="sacred">
      <CardContent className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Niveau 2"
          title="Diocèses"
          action={<CreateDioceseDialog defaultProvinceId={provinceId} />}
        />
        {isLoading ? (
          <SectionSkeleton />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les diocèses"
            onRetry={onRetry}
          />
        ) : dioceses.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title="Aucun diocèse"
            description="Aucun diocèse pour la sélection actuelle. Choisissez une autre province."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {dioceses.map((d) => {
              const active = selectedId === d.id;
              return (
                <li key={d.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(active ? undefined : d.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-accent/60 bg-accent/10 text-foreground shadow-soft-sm'
                        : 'border-border/60 bg-background-surface text-foreground hover:border-accent/40',
                    )}
                  >
                    <span className="truncate font-medium">{d.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {d.code}
                    </span>
                  </button>
                  <DioceseActions diocese={d} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ParishesSection({
  parishes,
  dioceseId,
  search,
  onSearch,
  isLoading,
  isError,
  onRetry,
}: {
  parishes: Parish[];
  /** Diocèse filtré en amont — présélectionné dans le dialogue de création. */
  dioceseId?: number;
  search: string;
  onSearch: (v: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [offset, setOffset] = useState(0);

  const page = useMemo(
    () => parishes.slice(offset, offset + PAGE_SIZE),
    [parishes, offset],
  );

  const columns: DataTableColumn<Parish>[] = [
    {
      header: 'Paroisse',
      mobileLabel: 'Nom',
      headClassName: TH_CLASS,
      cell: (p) => (
        <span className="text-sm font-medium text-foreground">{p.name}</span>
      ),
    },
    {
      header: 'Ville',
      headClassName: TH_CLASS,
      cell: (p) =>
        p.city ? (
          <span className="text-sm text-muted-foreground">{p.city}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Diocèse',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (p) =>
        p.diocese_name ? (
          <Pill>{p.diocese_name}</Pill>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (p) => <ParishActions parish={p} />,
    },
  ];

  return (
    <Card variant="feature">
      <CardContent className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Niveau 3"
          title="Paroisses"
          action={<CreateParishDialog defaultDioceseId={dioceseId} />}
        />
        <div className="mb-3">
          <label htmlFor="parish-search" className="sr-only">
            Rechercher une paroisse
          </label>
          <Input
            id="parish-search"
            type="search"
            placeholder="Rechercher une paroisse…"
            value={search}
            onChange={(e) => {
              onSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        {isError ? (
          <ErrorState
            title="Impossible de charger les paroisses"
            onRetry={onRetry}
          />
        ) : (
          <DataTable
            data={page}
            columns={columns}
            rowKey={(p) => p.id}
            isLoading={isLoading}
            caption="Liste des paroisses"
            emptyState={
              <EmptyState
                icon={<MapPin />}
                title="Aucune paroisse"
                description="Aucune paroisse ne correspond à cette recherche. Essayez un autre nom ou élargissez la sélection."
              />
            }
            pagination={{
              count: parishes.length,
              limit: PAGE_SIZE,
              offset,
              onOffsetChange: setOffset,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOrgPage() {
  const [provinceId, setProvinceId] = useState<number | undefined>(undefined);
  const [dioceseId, setDioceseId] = useState<number | undefined>(undefined);
  const [parishSearch, setParishSearch] = useState('');

  const {
    data: provinces,
    isLoading: provincesLoading,
    isError: provincesError,
    refetch: refetchProvinces,
  } = useProvinces();
  const {
    data: dioceses,
    isLoading: diocesesLoading,
    isError: diocesesError,
    refetch: refetchDioceses,
  } = useDioceses(provinceId);
  const {
    data: parishes,
    isLoading: parishesLoading,
    isError: parishesError,
    refetch: refetchParishes,
  } = useParishes({
    dioceseId,
    search: parishSearch || undefined,
  });

  return (
    <AdminPageLayout
      title="Structure territoriale"
      subtitle="Provinces, diocèses et paroisses de l'Église du Sénégal"
      allow={isSuperAdmin}
    >
      <div className="space-y-8">
        <ProvincesSection
          provinces={provinces ?? []}
          selectedId={provinceId}
          onSelect={(id) => {
            setProvinceId(id);
            setDioceseId(undefined);
          }}
          isLoading={provincesLoading}
          isError={provincesError}
          onRetry={() => refetchProvinces()}
        />
        <DiocesesSection
          dioceses={dioceses ?? []}
          provinceId={provinceId}
          selectedId={dioceseId}
          onSelect={setDioceseId}
          isLoading={diocesesLoading}
          isError={diocesesError}
          onRetry={() => refetchDioceses()}
        />
        <ParishesSection
          parishes={parishes ?? []}
          dioceseId={dioceseId}
          search={parishSearch}
          onSearch={setParishSearch}
          isLoading={parishesLoading}
          isError={parishesError}
          onRetry={() => refetchParishes()}
        />
      </div>
    </AdminPageLayout>
  );
}
