'use client';

import { Building2, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';
import { useDioceses } from '@/features/org/api/get-dioceses';
import { useParishes } from '@/features/org/api/get-parishes';
import { useProvinces } from '@/features/org/api/get-provinces';
import { isSuperAdmin } from '@/lib/authorization';
import type { Diocese, Parish } from '@/types/org';

const PAGE_SIZE = 20;

function ProvincesSection({
  provinces,
  selectedId,
  onSelect,
  isLoading,
}: {
  provinces: { id: number; name: string }[];
  selectedId?: number;
  onSelect: (id?: number) => void;
  isLoading: boolean;
}) {
  const options = [
    { value: '', label: 'Toutes' },
    ...provinces.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <section>
      <SectionHeader title="Provinces" />
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : (
        <FilterPills
          options={options}
          value={selectedId ? String(selectedId) : ''}
          onChange={(v) => onSelect(v ? Number(v) : undefined)}
          ariaLabel="Filtrer par province"
        />
      )}
    </section>
  );
}

function DiocesesSection({
  dioceses,
  selectedId,
  onSelect,
  isLoading,
}: {
  dioceses: Diocese[];
  selectedId?: number;
  onSelect: (id?: number) => void;
  isLoading: boolean;
}) {
  return (
    <section>
      <SectionHeader title="Diocèses" />
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : dioceses.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="Aucun diocèse"
          description="Aucun diocèse pour la sélection actuelle."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {dioceses.map((d) => {
            const active = selectedId === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelect(active ? undefined : d.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="truncate font-medium">{d.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {d.code}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ParishesSection({
  parishes,
  search,
  onSearch,
  isLoading,
}: {
  parishes: Parish[];
  search: string;
  onSearch: (v: string) => void;
  isLoading: boolean;
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
      cell: (p) => (
        <span className="text-sm font-medium text-foreground">{p.name}</span>
      ),
    },
    {
      header: 'Ville',
      cell: (p) =>
        p.city ? (
          <span className="text-sm text-muted-foreground">{p.city}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Diocèse',
      hideOnMobile: true,
      cell: (p) =>
        p.diocese_name ? (
          <Pill>{p.diocese_name}</Pill>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <section>
      <SectionHeader title="Paroisses" />
      <div className="mb-3">
        <label htmlFor="parish-search" className="sr-only">
          Rechercher une paroisse
        </label>
        <input
          id="parish-search"
          type="search"
          placeholder="Rechercher une paroisse…"
          value={search}
          onChange={(e) => {
            onSearch(e.target.value);
            setOffset(0);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
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
            description="Aucune paroisse ne correspond à cette recherche."
          />
        }
        pagination={{
          count: parishes.length,
          limit: PAGE_SIZE,
          offset,
          onOffsetChange: setOffset,
        }}
      />
    </section>
  );
}

export default function AdminOrgPage() {
  const [provinceId, setProvinceId] = useState<number | undefined>(undefined);
  const [dioceseId, setDioceseId] = useState<number | undefined>(undefined);
  const [parishSearch, setParishSearch] = useState('');

  const { data: provinces, isLoading: provincesLoading } = useProvinces();
  const { data: dioceses, isLoading: diocesesLoading } =
    useDioceses(provinceId);
  const { data: parishes, isLoading: parishesLoading } = useParishes({
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
        />
        <DiocesesSection
          dioceses={dioceses ?? []}
          selectedId={dioceseId}
          onSelect={setDioceseId}
          isLoading={diocesesLoading}
        />
        <ParishesSection
          parishes={parishes ?? []}
          search={parishSearch}
          onSearch={setParishSearch}
          isLoading={parishesLoading}
        />
      </div>
    </AdminPageLayout>
  );
}
