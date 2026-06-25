import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Badge de statut générique : icône + texte + couleur tokenisée.
 * La couleur n'est JAMAIS le seul signal (icône + libellé) → WCAG 1.4.1.
 * Chaque domaine (documents, intentions, transferts) fournit son mapping
 * `status -> { label, tone, icon }` dans sa feature.
 */
const statusBadgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground',
        info: 'bg-info/10 text-info',
        warning: 'bg-warning/10 text-warning',
        progress: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        danger: 'bg-destructive/10 text-destructive',
        accent: 'bg-accent/15 text-gold-ink',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type StatusTone = NonNullable<
  VariantProps<typeof statusBadgeVariants>['tone']
>;

export interface StatusConfig {
  label: string;
  tone: StatusTone;
  icon?: React.ReactNode;
}

interface StatusBadgeProps extends StatusConfig {
  className?: string;
}

export function StatusBadge({ label, tone, icon, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      {icon && (
        <span className="contents" aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}

export { statusBadgeVariants };
