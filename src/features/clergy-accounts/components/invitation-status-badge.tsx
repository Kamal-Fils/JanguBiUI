import { CheckCircle2, Clock, Slash, TimerOff } from 'lucide-react';

import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';

import { InvitationStatus } from '../types';

/**
 * Mapping unique statut d'invitation → libellé/ton/icône.
 * La couleur n'est jamais le seul signal (icône + libellé) → WCAG 1.4.1.
 */
export const INVITATION_STATUS_CONFIG: Record<InvitationStatus, StatusConfig> = {
  pending: { label: 'En attente', tone: 'warning', icon: <Clock /> },
  accepted: { label: 'Acceptée', tone: 'success', icon: <CheckCircle2 /> },
  revoked: { label: 'Révoquée', tone: 'danger', icon: <Slash /> },
  expired: { label: 'Expirée', tone: 'neutral', icon: <TimerOff /> },
};

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  className?: string;
}

export function InvitationStatusBadge({
  status,
  className,
}: InvitationStatusBadgeProps) {
  return (
    <StatusBadge {...INVITATION_STATUS_CONFIG[status]} className={className} />
  );
}
