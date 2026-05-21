import { cn } from '@/lib/utils';

import { InvitationStatus } from '../types';

const statusConfig: Record<
  InvitationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'En attente',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  accepted: {
    label: 'Acceptée',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  revoked: {
    label: 'Révoquée',
    className: 'bg-destructive/10 text-destructive',
  },
  expired: {
    label: 'Expirée',
    className: 'bg-gray-500/10 text-gray-500',
  },
};

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
}

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
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
