import * as React from 'react';

import { cn } from '@/utils/cn';

interface EmptyStateProps {
  /** Icône lucide (taille gérée par le composant). */
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Action optionnelle (ex. un <Button>). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * État vide partagé, tokenisé et en français.
 * Remplace les blocs `border-dashed text-center` réinventés par feature.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex animate-fade-in flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background-surface/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-7">
          {icon}
        </div>
      )}
      <p className="font-serif text-lg font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
