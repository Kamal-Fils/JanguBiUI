'use client';

import { cn } from '@/utils/cn';

import { DocumentStatus } from '../types';

/** `''` = aucun filtre (toute la file). */
export type QueueFilterValue = DocumentStatus | '';

interface QueueBucket {
  value: QueueFilterValue;
  /** Libellé métier de l'étape (vocabulaire paroissial, pas technique). */
  label: string;
  /** Classe de teinte du compteur — tokens sémantiques uniquement. */
  toneClass: string;
}

/**
 * Étapes de la file de travail, dans l'ordre du workflow. Les statuts
 * terminaux n'en font pas partie : ils vivent dans l'historique ci-dessous.
 */
export const QUEUE_BUCKETS: QueueBucket[] = [
  { value: '', label: 'Toutes', toneClass: 'text-foreground' },
  { value: 'submitted', label: 'À traiter', toneClass: 'text-info' },
  {
    value: 'under_verification',
    label: 'En vérification',
    toneClass: 'text-warning',
  },
  {
    value: 'info_requested',
    label: 'Attente fidèle',
    toneClass: 'text-gold-ink',
  },
  { value: 'validated', label: 'À signer', toneClass: 'text-success' },
];

/** Demandes sorties de la file — consultables, jamais comptées comme charge. */
export const HISTORY_BUCKETS: QueueBucket[] = [
  {
    value: 'document_deposited',
    label: 'Déposées',
    toneClass: 'text-muted-foreground',
  },
  { value: 'rejected', label: 'Rejetées', toneClass: 'text-muted-foreground' },
];

export type QueueCounts = Partial<Record<QueueFilterValue, number>>;

interface QueueCountersProps {
  value: QueueFilterValue;
  onChange: (value: QueueFilterValue) => void;
  /**
   * Comptages par étape, calculés par le serveur sur tout le périmètre
   * d'autorité (et non sur la page courante). `undefined` quand l'API ne les
   * fournit pas : les étapes s'affichent alors sans chiffre plutôt qu'avec un
   * « 0 » mensonger.
   */
  counts?: QueueCounts;
  /** Total renvoyé avec les comptages. */
  totalCount?: number;
}

/**
 * Compteurs-filtres de la file paroissiale : la charge de travail se lit en une
 * seconde, et chaque compteur est aussi le filtre de son étape.
 */
export function QueueCounters({
  value,
  onChange,
  counts,
  totalCount,
}: QueueCountersProps) {
  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Étapes de la file"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {QUEUE_BUCKETS.map((bucket) => {
          const active = bucket.value === value;
          const count = counts?.[bucket.value];
          return (
            <button
              key={bucket.value || 'all'}
              type="button"
              onClick={() => onChange(bucket.value)}
              aria-pressed={active}
              className={cn(
                'rounded-xl border bg-card px-3 py-2 text-left shadow-soft-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary ring-1 ring-primary/35'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              {count !== undefined && (
                <span
                  className={cn(
                    'block font-serif text-lg font-bold leading-none tabular-nums',
                    bucket.toneClass,
                  )}
                >
                  {count}
                </span>
              )}
              <span
                className={cn(
                  'block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground',
                  count !== undefined && 'mt-1',
                )}
              >
                {bucket.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Historique
        </span>
        {HISTORY_BUCKETS.map((bucket) => {
          const active = bucket.value === value;
          return (
            <button
              key={bucket.value}
              type="button"
              onClick={() => onChange(bucket.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {bucket.label}
            </button>
          );
        })}
      </div>

      {totalCount !== undefined && (
        <p className="text-[11px] text-muted-foreground">
          {totalCount} demande{totalCount > 1 ? 's' : ''} sur votre périmètre.
        </p>
      )}
    </div>
  );
}
