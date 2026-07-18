import { Fragment } from 'react';

import type { StatusTone } from '@/components/ui/status-badge';
import { cn } from '@/utils/cn';

import { DocumentStatus } from '../types';

import { DOCUMENT_STATUS_CONFIG } from './document-status-badge';

/**
 * Les 4 paliers du chemin nominal, en libellés courts pour le hub.
 * Les libellés longs (« Vérification au registre paroissial ») restent portés
 * par le suivi (`tracking-hero`) — ici la place est comptée.
 */
const TRACK_STAGES: { status: DocumentStatus; label: string }[] = [
  { status: 'submitted', label: 'Soumise' },
  { status: 'under_verification', label: 'Vérification' },
  { status: 'validated', label: 'Validée' },
  { status: 'document_deposited', label: 'Déposée' },
];

export const TRACK_LENGTH = TRACK_STAGES.length;

/**
 * Palier atteint sur la jauge. La liste ne renvoie ni pièces jointes ni
 * `status_logs` : la progression se déduit du seul `status`.
 * - `info_requested` n'ajoute pas d'étape — c'est une attente AU palier
 *   vérification (le fidèle doit répondre pour que la vérification reprenne).
 * - `rejected` interrompt le parcours : le hub ne trace pas les demandes
 *   terminales (lignes compactes), l'index retombe donc au premier palier.
 */
export function getTrackIndex(status: DocumentStatus): number {
  if (status === 'info_requested') {
    return TRACK_STAGES.findIndex(
      (stage) => stage.status === 'under_verification',
    );
  }
  const index = TRACK_STAGES.findIndex((stage) => stage.status === status);
  return index === -1 ? 0 : index;
}

/** Point courant : teinté du ton du statut (source unique `DOCUMENT_STATUS_CONFIG`). */
const TONE_DOT: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-info',
  warning: 'bg-warning',
  progress: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-destructive',
  accent: 'bg-accent',
};

interface MiniTrackProps {
  status: DocumentStatus;
  className?: string;
}

/**
 * Mini-timeline horizontale 4 points — « suivi de colis » sur la carte du hub :
 * savoir où en est une demande sans ouvrir son détail.
 *
 * Accessibilité : l'ensemble est un graphique unique (`role="img"`) dont le
 * `aria-label` décrit l'étape courante ; les points et libellés visuels ne sont
 * donc pas relus un à un par le lecteur d'écran.
 */
export function MiniTrack({ status, className }: MiniTrackProps) {
  const currentIndex = getTrackIndex(status);
  const { label: statusLabel, tone } = DOCUMENT_STATUS_CONFIG[status];
  const description = `Étape ${currentIndex + 1} sur ${TRACK_LENGTH} : ${
    TRACK_STAGES[currentIndex].label
  }. Statut : ${statusLabel}.`;

  return (
    <div
      className={cn('select-none', className)}
      role="img"
      aria-label={description}
    >
      <div className="flex items-center">
        {TRACK_STAGES.map((stage, index) => (
          <Fragment key={stage.status}>
            {index > 0 && (
              <span
                className={cn(
                  'h-0.5 flex-1',
                  index <= currentIndex ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            {index === currentIndex ? (
              <span className="relative flex size-2.5 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    'absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:hidden',
                    TONE_DOT[tone],
                  )}
                />
                <span
                  className={cn(
                    'relative size-2.5 rounded-full ring-2 ring-background',
                    TONE_DOT[tone],
                  )}
                />
              </span>
            ) : (
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full border-2',
                  index < currentIndex
                    ? 'border-primary bg-primary'
                    : 'border-border bg-muted',
                )}
              />
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-1 text-[10px] leading-none">
        {TRACK_STAGES.map((stage, index) => (
          <span
            key={stage.status}
            className={cn(
              index === currentIndex
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}
