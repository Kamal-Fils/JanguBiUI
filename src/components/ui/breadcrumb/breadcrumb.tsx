import { ChevronRight } from 'lucide-react';

import { Link } from '@/components/ui/link/link';
import type { Crumb } from '@/config/breadcrumbs';
import { cn } from '@/utils/cn';

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

/**
 * Fil d'Ariane présentational. Le dernier élément est l'élément courant (texte,
 * non cliquable, tronqué) ; les précédents sont des liens.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex min-w-0 items-center', className)}
    >
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
