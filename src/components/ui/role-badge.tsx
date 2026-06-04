import { StatusBadge } from '@/components/ui/status-badge';
import { roleLabel, roleTone } from '@/config/roles';

interface RoleBadgeProps {
  role: string | null | undefined;
  className?: string;
}

/** Badge de rôle utilisateur — libellé + couleur depuis `@/config/roles`. */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <StatusBadge
      label={roleLabel(role)}
      tone={roleTone(role)}
      className={className}
    />
  );
}
