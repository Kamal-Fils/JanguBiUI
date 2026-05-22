'use client';

import { useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { useDioceses } from '@/features/org/api/get-dioceses';
import { useParishes } from '@/features/org/api/get-parishes';
import { useProvinces } from '@/features/org/api/get-provinces';
import { useUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/authorization';

export default function AdminOrgPage() {
  const { data: user } = useUser();
  const [selectedProvinceId, setSelectedProvinceId] = useState<
    number | undefined
  >(undefined);
  const [selectedDioceseId, setSelectedDioceseId] = useState<
    number | undefined
  >(undefined);
  const [parishSearch, setParishSearch] = useState('');

  const { data: provinces, isLoading: provincesLoading } = useProvinces();
  const { data: dioceses, isLoading: diocesesLoading } =
    useDioceses(selectedProvinceId);
  const { data: parishes, isLoading: parishesLoading } = useParishes({
    dioceseId: selectedDioceseId,
    search: parishSearch || undefined,
  });

  if (!isSuperAdmin(user)) {
    return (
      <AppShell>
        <div className="flex flex-col">
          <PageHeader title="Structure territoriale" />
          <p className="p-4 text-sm text-destructive">
            Accès réservé au super administrateur.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader title="Structure territoriale" />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8 space-y-6">
        {/* Provinces */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Provinces</h2>
          {provincesLoading && (
            <p className="text-xs text-gray-400">Chargement…</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedProvinceId(undefined);
                setSelectedDioceseId(undefined);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedProvinceId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            {provinces?.map((prov) => (
              <button
                key={prov.id}
                type="button"
                onClick={() => {
                  setSelectedProvinceId(prov.id);
                  setSelectedDioceseId(undefined);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedProvinceId === prov.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {prov.name}
              </button>
            ))}
          </div>
        </section>

        {/* Dioceses */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Diocèses{selectedProvinceId ? ` — province sélectionnée` : ''}
          </h2>
          {diocesesLoading && (
            <p className="text-xs text-gray-400">Chargement…</p>
          )}
          {!diocesesLoading && dioceses?.length === 0 && (
            <p className="text-xs text-gray-400">Aucun diocèse.</p>
          )}
          <ul className="space-y-1">
            {dioceses?.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDioceseId(
                      selectedDioceseId === d.id ? undefined : d.id,
                    )
                  }
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedDioceseId === d.id
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-gray-100 text-gray-700 hover:border-blue-200'
                  }`}
                >
                  <span className="font-medium">{d.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{d.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Parishes */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Paroisses{selectedDioceseId ? ` — diocèse sélectionné` : ''}
          </h2>
          <input
            id="parish-search"
            type="search"
            placeholder="Rechercher une paroisse…"
            value={parishSearch}
            onChange={(e) => setParishSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {parishesLoading && (
            <p className="text-xs text-gray-400">Chargement…</p>
          )}
          {!parishesLoading && parishes?.length === 0 && (
            <p className="text-xs text-gray-400">Aucune paroisse trouvée.</p>
          )}
          <ul className="space-y-1">
            {parishes?.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-800">{p.name}</span>
                {p.city && (
                  <span className="text-xs text-gray-400">{p.city}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
        </div>
      </div>
    </AppShell>
  );
}
