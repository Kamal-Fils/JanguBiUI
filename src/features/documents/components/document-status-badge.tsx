import {
  CheckCircle2,
  FileCheck2,
  Info,
  Search,
  Send,
  XCircle,
} from 'lucide-react';

import {
  StatusBadge,
  type StatusConfig,
} from '@/components/ui/status-badge';

import { DocumentStatus } from '../types';

/**
 * Mapping unique statut → libellé/ton/icône, réutilisé par le badge, le liseré
 * de carte (documents-list) et la timeline d'historique (document-detail).
 */
export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusConfig> = {
  submitted: { label: 'Soumis', tone: 'info', icon: <Send /> },
  under_verification: {
    label: 'En vérification',
    tone: 'warning',
    icon: <Search />,
  },
  validated: { label: 'Validé', tone: 'success', icon: <CheckCircle2 /> },
  document_deposited: {
    label: 'Déposé',
    tone: 'progress',
    icon: <FileCheck2 />,
  },
  info_requested: { label: 'Infos requises', tone: 'accent', icon: <Info /> },
  rejected: { label: 'Refusé', tone: 'danger', icon: <XCircle /> },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({
  status,
  className,
}: DocumentStatusBadgeProps) {
  return (
    <StatusBadge {...DOCUMENT_STATUS_CONFIG[status]} className={className} />
  );
}
