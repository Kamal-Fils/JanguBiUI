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
        className="flex flex-wrap gap-1.5"
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
                // Chiffre et libellé sur une seule ligne : la charge se lit
                // d'un balayage horizontal au lieu d'occuper trois rangées.
                'inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              {count !== undefined && (
                <span
                  className={cn(
                    'text-base font-bold leading-none tabular-nums',
                    bucket.toneClass,
                  )}
                >
                  {count}
                </span>
              )}
              <span className="text-xs font-semibold leading-none text-foreground">
                {bucket.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Historique + périmètre sur une seule ligne : ce sont des repères, pas
          la charge de travail — ils ne méritent pas une rangée chacun. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-medium text-muted-foreground">
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
                'inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/70',
              )}
            >
              {bucket.label}
            </button>
          );
        })}

        {totalCount !== undefined && (
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {totalCount} demande{totalCount > 1 ? 's' : ''} sur votre périmètre.
          </p>
        )}
      </div>
    </div>
  );
}
