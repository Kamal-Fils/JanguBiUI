import { cn } from '@/lib/utils';

import { DocumentStatus } from '../types';

const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: 'Soumis',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  under_verification: {
    label: 'En vérification',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  validated: {
    label: 'Validé',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  document_deposited: {
    label: 'Déposé',
    className: 'bg-primary/10 text-primary',
  },
  info_requested: {
    label: 'Infos requises',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  rejected: {
    label: 'Refusé',
    className: 'bg-destructive/10 text-destructive',
  },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
