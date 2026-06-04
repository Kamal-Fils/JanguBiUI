import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';

/**
 * Mapping unique statut → libellé/ton/icône pour les intentions de messe.
 * Co-localisé dans la feature (le kit `StatusBadge` reste agnostique).
 * La couleur n'est jamais le seul signal : icône + libellé → WCAG 1.4.1.
 */
export const INTENTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: 'En attente', tone: 'warning', icon: <Clock /> },
  accepted: { label: 'Acceptée', tone: 'info', icon: <CheckCircle2 /> },
  date_proposed: {
    label: 'Date proposée',
    tone: 'accent',
    icon: <CalendarClock />,
  },
  confirmed: {
    label: 'Confirmée',
    tone: 'progress',
    icon: <CalendarCheck />,
  },
  celebrated: { label: 'Célébrée', tone: 'success', icon: <Sparkles /> },
  declined: { label: 'Refusée', tone: 'danger', icon: <XCircle /> },
};

interface IntentionStatusBadgeProps {
  status: string;
  className?: string;
}

export function IntentionStatusBadge({
  status,
  className,
}: IntentionStatusBadgeProps) {
  const config: StatusConfig = INTENTION_STATUS_CONFIG[status] ?? {
    label: status,
    tone: 'neutral',
  };
  return <StatusBadge {...config} className={className} />;
}
