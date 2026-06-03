import {
  CheckCircle2,
  Clock,
  Hourglass,
  Inbox,
  XCircle,
} from 'lucide-react';

import {
  StatusBadge,
  type StatusConfig,
} from '@/components/ui/status-badge';

import { TransferStatus } from '../types';

/**
 * Mapping unique statut → libellé/ton/icône, réutilisé par le badge, la carte
 * de suivi (transfer-status-card) et la timeline d'historique. Aligné sur le
 * pattern de `documents/components/document-status-badge.tsx`.
 */
export const TRANSFER_STATUS_CONFIG: Record<TransferStatus, StatusConfig> = {
  pending: { label: 'En attente', tone: 'warning', icon: <Clock /> },
  approved_by_origin: {
    label: "Approuvé par l'origine",
    tone: 'info',
    icon: <Hourglass />,
  },
  acknowledged_by_destination: {
    label: 'Accusé réception',
    tone: 'progress',
    icon: <Inbox />,
  },
  completed: {
    label: 'Transfert effectué',
    tone: 'success',
    icon: <CheckCircle2 />,
  },
  rejected: { label: 'Refusé', tone: 'danger', icon: <XCircle /> },
};

/** Ordre canonique de progression du workflow (hors statut terminal `rejected`). */
export const TRANSFER_PROGRESS_ORDER: TransferStatus[] = [
  'pending',
  'approved_by_origin',
  'acknowledged_by_destination',
  'completed',
];

interface TransferStatusBadgeProps {
  status: TransferStatus;
  className?: string;
}

export function TransferStatusBadge({
  status,
  className,
}: TransferStatusBadgeProps) {
  return (
    <StatusBadge {...TRANSFER_STATUS_CONFIG[status]} className={className} />
  );
}
