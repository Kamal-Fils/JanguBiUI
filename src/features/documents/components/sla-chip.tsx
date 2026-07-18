import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  PauseCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { DocumentRequest, DocumentStatus } from '../types';

import { TERMINAL_STATUSES } from './tracking-hero';

/**
 * Seuil d'escalade des demandes, aligné sur le réglage backend
 * `DOCS_ESCALATE_DAYS` (défaut **7 jours**, `config/django/base.py`) : au-delà,
 * la tâche Celery quotidienne (08:00 UTC) escalade la demande.
 *
 * ⚠️ L'API ne renvoie NI `age_days` NI de flag d'escalade dans la liste
 * (cf. PLAN_documents §6.2) : l'âge est donc recalculé côté client depuis
 * `created_at`. **À re-synchroniser si le réglage Django change** — le jour où
 * le backend expose le seuil, cette constante doit céder la place à sa valeur.
 */
export const SLA_ESCALATE_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Âge de la demande en jours pleins (J+0 = reçue aujourd'hui). */
export function getDocumentAgeDays(
  createdAt: string,
  now: Date = new Date(),
): number {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - created.getTime()) / MS_PER_DAY),
  );
}

/**
 * - `late` : seuil d'escalade atteint — le backend a relancé.
 * - `due` : à la veille du seuil.
 * - `ok` : dans les temps.
 * - `dormant` : `info_requested` — la balle est dans le camp du fidèle, donc
 *   **aucune alerte SLA** : la paroisse n'a rien à se reprocher.
 * - `closed` : demande terminale, hors file.
 */
export type SlaKind = 'late' | 'due' | 'ok' | 'dormant' | 'closed';

export interface SlaState {
  kind: SlaKind;
  ageDays: number;
}

type SlaInput = Pick<DocumentRequest, 'status' | 'created_at'>;

export function getSlaState(document: SlaInput, now?: Date): SlaState {
  const ageDays = getDocumentAgeDays(document.created_at, now);

  if (TERMINAL_STATUSES.includes(document.status))
    return { kind: 'closed', ageDays };
  // En attente du fidèle : mise en veille, jamais d'alerte.
  if (document.status === 'info_requested') return { kind: 'dormant', ageDays };
  if (ageDays >= SLA_ESCALATE_DAYS) return { kind: 'late', ageDays };
  if (ageDays >= SLA_ESCALATE_DAYS - 1) return { kind: 'due', ageDays };
  return { kind: 'ok', ageDays };
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
  dormant: 1,
  closed: 2,
};

export function compareByUrgency(a: SlaInput, b: SlaInput, now?: Date): number {
  const stateA = getSlaState(a, now);
  const stateB = getSlaState(b, now);
  const rankDelta = QUEUE_RANK[stateA.kind] - QUEUE_RANK[stateB.kind];
  if (rankDelta !== 0) return rankDelta;
  return stateB.ageDays - stateA.ageDays;
}

const CHIP_CLASS =
  'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums [&_svg]:size-3';

/**
 * Couleur + icône + libellé : la couleur n'est jamais le seul signal (WCAG
 * 1.4.1). Tokens sémantiques uniquement.
 */
const CHIP_STYLES: Record<SlaKind, string> = {
  late: 'bg-destructive/10 text-destructive',
  due: 'bg-warning/10 text-warning',
  ok: 'bg-success/10 text-success',
  dormant: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground',
};

const CHIP_ICONS: Record<SlaKind, ReactNode> = {
  late: <AlertTriangle />,
  due: <Clock />,
  ok: <CheckCircle2 />,
  dormant: <PauseCircle />,
  closed: <Archive />,
};

function getChipLabel({ kind, ageDays }: SlaState): string {
  if (kind === 'dormant') return 'En attente du fidèle';
  if (kind === 'closed') return 'Clôturée';
  if (kind === 'late') return `J+${ageDays} · en retard`;
  if (kind === 'due') return `J+${ageDays} · seuil J+${SLA_ESCALATE_DAYS}`;
  return `J+${ageDays}`;
}

function getChipTitle({ kind, ageDays }: SlaState): string {
  if (kind === 'dormant')
    return 'La paroisse attend une réponse du fidèle : le délai de traitement est suspendu.';
  if (kind === 'closed')
    return 'Demande clôturée : elle ne fait plus partie de la file.';
  if (kind === 'late')
    return `Reçue il y a ${ageDays} jours — au-delà du seuil d'escalade automatique (J+${SLA_ESCALATE_DAYS}).`;
  return `Reçue il y a ${ageDays} jour${ageDays > 1 ? 's' : ''} — seuil d'escalade à J+${SLA_ESCALATE_DAYS}.`;
}

interface SlaChipProps {
  status: DocumentStatus;
  createdAt: string;
  /** Injectable pour les tests — évite de dépendre de l'horloge réelle. */
  now?: Date;
  className?: string;
}

/**
 * Pastille d'ancienneté d'une demande, alignée sur l'escalade backend.
 * Rend visible ce que le système surveille déjà en silence.
 */
export function SlaChip({ status, createdAt, now, className }: SlaChipProps) {
  const state = getSlaState({ status, created_at: createdAt }, now);

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
