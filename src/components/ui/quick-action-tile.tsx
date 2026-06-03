import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';

type ActionTone = 'primary' | 'gold' | 'success' | 'info' | 'warning';

const toneClass: Record<ActionTone, string> = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-accent/15 text-accent',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
};

interface QuickActionTileProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  tone?: ActionTone;
  className?: string;
}

/**
 * Tuile d'accès rapide (dashboards) — cible tactile large (≥44px), pastille
 * d'icône colorée. Remplace les 4 grilles de quick-actions dupliquées.
 */
export function QuickActionTile({
  href,
  icon,
  label,
  description,
  tone = 'primary',
  className,
}: QuickActionTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.98] motion-reduce:transform-none',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
          toneClass[tone],
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {label}
        </span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </Link>
  );
}
