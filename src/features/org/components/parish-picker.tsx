'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useUser } from '@/lib/auth';

import { getParishesQueryOptions } from '../api/get-parishes';

/**
 * Paroisse normalisée émise par le picker. `dioceseName` permet de satisfaire
 * la validation back (champ `diocese` requis) — le back la réécrit ensuite
 * depuis la FK `parish_id` (C4).
 */
export interface PickedParish {
  id: number;
  name: string;
  dioceseName: string;
}

interface ParishPickerProps {
  value: PickedParish | null;
  onChange: (parish: PickedParish | null) => void;
  disabled?: boolean;
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Sélecteur de paroisse du registre (Chantier 7c, F3/F3b/F3c).
 *
 * Remplace la saisie texte libre parish_name/diocese. Les paroisses
 * d'appartenance du fidèle (memberships) sont proposées EN TÊTE comme
 * raccourci ; une recherche libre couvre TOUTES les paroisses
 * (GET /org/parishes/, nom + ville) car le registre peut être une autre
 * paroisse que celle d'appartenance.
 */
export function ParishPicker({ value, onChange, disabled }: ParishPickerProps) {
  const { data: user } = useUser();
  const [search, setSearch] = useState('');
  const trimmed = search.trim();

  // Paroisses d'appartenance dédupliquées (raccourci en tête).
  const seen = new Set<number>();
  const membershipParishes: PickedParish[] = [];
  for (const m of user?.memberships ?? []) {
    if (seen.has(m.parish.id)) continue;
    seen.add(m.parish.id);
    membershipParishes.push({
      id: m.parish.id,
      name: m.parish.name,
      dioceseName: m.diocese.name,
    });
  }

  const { data: results = [], isFetching } = useQuery({
    ...getParishesQueryOptions({ search: trimmed }),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
  });

  const handleSearchPick = (parish: {
    id: number;
    name: string;
    diocese_name: string;
  }) => {
    onChange({
      id: parish.id,
      name: parish.name,
      dioceseName: parish.diocese_name,
    });
    setSearch('');
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary">
            {value.name}
          </p>
          {value.dioceseName && (
            <p className="truncate text-xs text-muted-foreground">
              {value.dioceseName}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="shrink-0 text-xs font-medium text-primary underline hover:opacity-80 disabled:opacity-50"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {membershipParishes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Mes paroisses
          </p>
          <div className="flex flex-col gap-1.5">
            {membershipParishes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p)}
                disabled={disabled}
                className="flex flex-col items-start rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:bg-muted disabled:opacity-50"
              >
                <span className="text-sm font-medium text-foreground">
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.dioceseName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          aria-label="Rechercher une paroisse du registre"
          placeholder="Rechercher une autre paroisse (nom ou ville)…"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {trimmed.length >= MIN_SEARCH_LENGTH && (
          <ul className="space-y-1.5" aria-label="Résultats de recherche">
            {isFetching && (
              <li className="px-1 py-1 text-xs text-muted-foreground">
                Recherche…
              </li>
            )}
            {!isFetching && results.length === 0 && (
              <li className="px-1 py-1 text-xs text-muted-foreground">
                Aucune paroisse trouvée.
              </li>
            )}
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleSearchPick({
                      id: p.id,
                      name: p.name,
                      diocese_name: p.diocese_name,
                    })
                  }
                  disabled={disabled}
                  className="flex w-full flex-col items-start rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:bg-muted disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[p.city, p.diocese_name].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
