import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  HelpCircle,
  PauseCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { DocumentRequest } from '../types';

import { TERMINAL_STATUSES } from './tracking-hero';

/**
 * Le délai est une donnée **serveur** (`apps/documents/sla.py`) : l'ancienneté
 * se mesure depuis la dernière action (`updated_at`) et le seuil dépend du
 * statut — 7 jours pour une demande à prendre en charge ou en vérification,
 * 3 pour une demande validée en attente de dépôt, 5 pour une demande d'info.
 *
 * Le client ne recalcule donc plus rien : la version précédente mesurait
 * l'ancienneté depuis la création avec un seuil unique de 7 jours et affichait
 * « en retard » des demandes que le backend n'escalade pas.
 */

/**
 * - `late` : seuil atteint — le backend a relancé.
 * - `due` : à la veille du seuil.
 * - `ok` : dans les temps.
 * - `dormant` : `info_requested` — la balle est dans le camp du fidèle, donc
 *   aucune alerte : la paroisse n'a rien à se reprocher.
 * - `closed` : demande terminale, hors file.
 * - `unknown` : le serveur n'a pas fourni de délai (backend pas encore
 *   déployé) — état neutre, jamais d'alerte inventée.
 */
export type SlaKind = 'late' | 'due' | 'ok' | 'dormant' | 'closed' | 'unknown';

export interface SlaState {
  kind: SlaKind;
  /** Jours depuis la dernière action, tels que calculés par le serveur. */
  ageDays: number | null;
  thresholdDays: number | null;
}

type SlaInput = Pick<
  DocumentRequest,
  'status' | 'sla_days' | 'sla_threshold_days' | 'is_escalated'
>;

export function getSlaState(document: SlaInput): SlaState {
  const ageDays = document.sla_days ?? null;
  const thresholdDays = document.sla_threshold_days ?? null;

  if (TERMINAL_STATUSES.includes(document.status))
    return { kind: 'closed', ageDays, thresholdDays };
  // En attente du fidèle : mise en veille, jamais d'alerte.
  if (document.status === 'info_requested')
    return { kind: 'dormant', ageDays, thresholdDays };
  // Repli : sans donnée serveur, on n'invente pas de seuil.
  if (ageDays === null || thresholdDays === null)
    return { kind: 'unknown', ageDays, thresholdDays };
  if (document.is_escalated || ageDays >= thresholdDays)
    return { kind: 'late', ageDays, thresholdDays };
  if (ageDays >= thresholdDays - 1)
    return { kind: 'due', ageDays, thresholdDays };
  return { kind: 'ok', ageDays, thresholdDays };
}

/**
 * Ordre de la file : d'abord ce qui demande une action de la paroisse (par âge
 * décroissant — le plus ancien en tête), puis les demandes en veille (attente
 * du fidèle), puis les demandes clôturées.
 */
const QUEUE_RANK: Record<SlaKind, number> = {
  late: 0,
  due: 0,
  ok: 0,
  unknown: 0,
  dormant: 1,
  closed: 2,
};

export function compareByUrgency(a: SlaInput, b: SlaInput): number {
  const stateA = getSlaState(a);
  const stateB = getSlaState(b);
  const rankDelta = QUEUE_RANK[stateA.kind] - QUEUE_RANK[stateB.kind];
  if (rankDelta !== 0) return rankDelta;
  return (stateB.ageDays ?? -1) - (stateA.ageDays ?? -1);
}

const CHIP_CLASS =
  'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums [&_svg]:size-3';

/**
 * Couleur + icône + libellé : la couleur n'est jamais le seul signal (WCAG
 * 1.4.1). Tokens sémantiques uniquement.
 */
const CHIP_STYLES: Record<SlaKind, string> = {
  // Le retard porte en plus un cerne : sur un écran dense, une pastille
  // simplement teintée se noie dans la file.
  late: 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
  due: 'bg-warning/10 text-warning',
  ok: 'bg-success/10 text-success',
  dormant: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground',
  unknown: 'bg-muted text-muted-foreground',
};

/**
 * Liseré de la ligne en vue mobile. Redondant avec la pastille (icône +
 * libellé) : la couleur ne porte jamais seule l'information de retard, elle
 * ne fait que la rendre repérable au défilement.
 */
export const SLA_ROW_ACCENT: Record<SlaKind, string> = {
  late: 'border-l-destructive',
  due: 'border-l-warning',
  ok: 'border-l-border',
  dormant: 'border-l-border',
  closed: 'border-l-border',
  unknown: 'border-l-border',
};

const CHIP_ICONS: Record<SlaKind, ReactNode> = {
  late: <AlertTriangle />,
  due: <Clock />,
  ok: <CheckCircle2 />,
  dormant: <PauseCircle />,
  closed: <Archive />,
  unknown: <HelpCircle />,
};

function getChipLabel({ kind, ageDays, thresholdDays }: SlaState): string {
  if (kind === 'dormant') return 'En attente du fidèle';
  if (kind === 'closed') return 'Clôturée';
  if (kind === 'unknown') return 'Délai indisponible';
  if (kind === 'late') return `J+${ageDays} · en retard`;
  if (kind === 'due') return `J+${ageDays} · seuil J+${thresholdDays}`;
  return `J+${ageDays}`;
}

function getChipTitle({ kind, ageDays, thresholdDays }: SlaState): string {
  if (kind === 'dormant')
    return 'La paroisse attend une réponse du fidèle : le délai de traitement est suspendu.';
  if (kind === 'closed')
    return 'Demande clôturée : elle ne fait plus partie de la file.';
  if (kind === 'unknown')
    return "Le serveur n'a pas fourni de délai pour cette demande.";
  const plural = (ageDays ?? 0) > 1 ? 's' : '';
  if (kind === 'late')
    return `Sans action depuis ${ageDays} jour${plural} — au-delà du seuil de relance automatique (J+${thresholdDays}).`;
  return `Sans action depuis ${ageDays} jour${plural} — seuil de relance à J+${thresholdDays}.`;
}

interface SlaChipProps {
  document: SlaInput;
  className?: string;
}

/**
 * Pastille de délai d'une demande, reflétant exactement ce que la relance
 * automatique du backend surveille.
 */
export function SlaChip({ document, className }: SlaChipProps) {
  const state = getSlaState(document);

  return (
    <span
      className={cn(CHIP_CLASS, CHIP_STYLES[state.kind], className)}
      title={getChipTitle(state)}
    >
      <span className="contents" aria-hidden="true">
        {CHIP_ICONS[state.kind]}
      </span>
      {getChipLabel(state)}
    </span>
  );
}
