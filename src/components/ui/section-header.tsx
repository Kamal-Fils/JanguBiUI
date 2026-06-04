import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';

interface SectionHeaderProps {
  title: string;
  /** Sous-titre / accroche optionnel. */
  description?: React.ReactNode;
  /** Lien « Tout voir » optionnel. */
  actionHref?: string;
  actionLabel?: string;
  /** Action arbitraire (prioritaire sur actionHref). */
  action?: React.ReactNode;
  /** Niveau de titre rendu (défaut h2). */
  as?: 'h2' | 'h3';
  className?: string;
}

/**
 * En-tête de section éditorial : titre serif + filet or + lien « Tout voir ».
 * Remplace les `flex justify-between` (h2 + Link) dupliqués partout.
 */
export function SectionHeader({
  title,
  description,
  actionHref,
  actionLabel = 'Tout voir',
  action,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Heading className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </Heading>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action ??
          (actionHref && (
            <Link
              href={actionHref}
              className="shrink-0 text-sm font-medium text-primary hover:text-primary/80"
            >
              {actionLabel}
            </Link>
          ))}
      </div>
      <div className="hairline-gold mt-2.5" aria-hidden="true" />
    </div>
  );
}
