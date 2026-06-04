'use client';

import { MapPin } from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  StatusTimeline,
  type TimelineStep,
} from '@/components/ui/status-timeline';

import { TransferRequest, TransferStatus } from '../types';

import {
  TRANSFER_PROGRESS_ORDER,
  TRANSFER_STATUS_CONFIG,
  TransferStatusBadge,
} from './transfer-status-badge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Construit les étapes de la timeline à partir du statut courant. Le workflow
 * est linéaire (pending → approved_by_origin → acknowledged_by_destination →
 * completed). Un refus remplace la dernière étape par un nœud d'erreur.
 */
function buildTimelineSteps(status: TransferStatus): TimelineStep[] {
  if (status === 'rejected') {
    const cfg = TRANSFER_STATUS_CONFIG.rejected;
    return [
      {
        label: TRANSFER_STATUS_CONFIG.pending.label,
        tone: TRANSFER_STATUS_CONFIG.pending.tone,
        icon: TRANSFER_STATUS_CONFIG.pending.icon,
        state: 'done',
      },
      {
        label: cfg.label,
        tone: cfg.tone,
        icon: cfg.icon,
        state: 'current',
      },
    ];
  }

  const currentIndex = TRANSFER_PROGRESS_ORDER.indexOf(status);
  return TRANSFER_PROGRESS_ORDER.map((step, idx): TimelineStep => {
    const cfg = TRANSFER_STATUS_CONFIG[step];
    return {
      label: cfg.label,
      tone: cfg.tone,
      icon: idx <= currentIndex ? cfg.icon : undefined,
      state:
        idx < currentIndex
          ? 'done'
          : idx === currentIndex
            ? 'current'
            : 'upcoming',
    };
  });
}

interface TransferStatusCardProps {
  transfer: TransferRequest;
}

export function TransferStatusCard({ transfer }: TransferStatusCardProps) {
  const isRejected = transfer.status === 'rejected';
  const isCompleted = transfer.status === 'completed';

  return (
    <Card variant="elevated" className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <TransferStatusBadge status={transfer.status} />
          <p className="mt-2 text-xs text-muted-foreground">
            Demande soumise le {formatDate(transfer.created_at)}
          </p>
        </div>
      </div>

      {transfer.origin_parish_name && (
        <div className="mt-4 flex items-center gap-1.5 text-sm text-foreground">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            <span className="font-medium">{transfer.origin_parish_name}</span>
            <span className="mx-1.5 text-muted-foreground" aria-hidden="true">
              →
            </span>
            <span className="font-medium">
              {transfer.destination_parish_name ?? '…'}
            </span>
          </span>
        </div>
      )}

      {transfer.reason && (
        <p className="mt-3 text-sm italic text-muted-foreground">
          « {transfer.reason} »
        </p>
      )}

      {isRejected && transfer.rejection_reason && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Motif du refus
          </p>
          <p className="mt-1 text-sm text-destructive/90">
            {transfer.rejection_reason}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Suivi de la demande
        </p>
        <StatusTimeline steps={buildTimelineSteps(transfer.status)} />
      </div>

      {isCompleted && (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
          Votre transfert paroissial est effectif. Bienvenue dans votre nouvelle
          paroisse !
        </div>
      )}
    </Card>
  );
}
