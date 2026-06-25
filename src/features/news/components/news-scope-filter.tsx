'use client';

import type { Membership, OrgRef } from '@/lib/auth';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

import type { GetArticlesParams } from '../api/get-articles';

/**
 * Valeur de filtre de portée du fil d'actualités.
 * - `all`     → l'agrégat (toutes les portées de l'utilisateur)
 * - `global`  → uniquement les articles universels
 * - territorial → une entité précise parmi les appartenances de l'utilisateur
 */
export type ScopeFilterValue =
  | { kind: 'all' }
  | { kind: 'global' }
  | { kind: 'diocese' | 'parish' | 'church'; id: number; name: string };

export const ALL_SCOPE: ScopeFilterValue = { kind: 'all' };

export interface ScopeFilterOption {
  key: string;
  label: string;
  value: ScopeFilterValue;
}

function dedupeRefs(refs: OrgRef[]): OrgRef[] {
  const byId = new Map<number, OrgRef>();
  for (const ref of refs) {
    if (!byId.has(ref.id)) byId.set(ref.id, ref);
  }
  return [...byId.values()];
}

/**
 * Dérive les options de filtre des appartenances de l'utilisateur :
 * Tous · Universel · [ses diocèses] · [ses paroisses] · [ses églises].
 * Une portée hors appartenances n'apparaît jamais (les options ne viennent QUE
 * des memberships). Diocèses/paroisses sont dédupliqués.
 */
export function buildScopeFilterOptions(
  memberships: Membership[] = [],
): ScopeFilterOption[] {
  const dioceses = dedupeRefs(memberships.map((m) => m.diocese));
  const parishes = dedupeRefs(memberships.map((m) => m.parish));
  const churches = dedupeRefs(memberships.map((m) => m.church));

  return [
    { key: 'all', label: 'Tous', value: { kind: 'all' } },
    { key: 'global', label: 'Universel', value: { kind: 'global' } },
    ...dioceses.map((d) => ({
      key: `diocese-${d.id}`,
      label: d.name,
      value: { kind: 'diocese' as const, id: d.id, name: d.name },
    })),
    ...parishes.map((p) => ({
      key: `parish-${p.id}`,
      label: p.name,
      value: { kind: 'parish' as const, id: p.id, name: p.name },
    })),
    ...churches.map((c) => ({
      key: `church-${c.id}`,
      label: c.name,
      value: { kind: 'church' as const, id: c.id, name: c.name },
    })),
  ];
}

/** Convertit la valeur de filtre en query params pour le feed (param serveur). */
export function scopeFilterToParams(
  value: ScopeFilterValue,
): Pick<GetArticlesParams, 'scope_type' | 'scope_id'> {
  if (value.kind === 'all') return {};
  if (value.kind === 'global') return { scope_type: 'global' };
  return { scope_type: value.kind, scope_id: value.id };
}

export function isSameScope(a: ScopeFilterValue, b: ScopeFilterValue): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'all' || a.kind === 'global') return true;
  return a.id === (b as Extract<ScopeFilterValue, { id: number }>).id;
}

interface NewsScopeFilterProps {
  value: ScopeFilterValue;
  onChange: (value: ScopeFilterValue) => void;
}

export function NewsScopeFilter({ value, onChange }: NewsScopeFilterProps) {
  const { data: user } = useUser();
  const options = buildScopeFilterOptions(user?.memberships);

  // Pas d'appartenance → seuls Tous/Universel : pas de filtre territorial à proposer.
  if (options.length <= 2) return null;

  return (
    <div
      role="group"
      aria-label="Filtrer par portée"
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {options.map((opt) => {
        const active = isSameScope(opt.value, value);
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.08em] transition-[background-color,border-color,color,box-shadow] duration-150',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-soft-sm'
                : 'border-border/70 bg-transparent text-muted-foreground hover:border-accent/40 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
