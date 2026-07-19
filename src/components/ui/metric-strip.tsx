'use client';

import Link from 'next/link';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

export interface WorkMetric {
  label: string;
  value: React.ReactNode;
  href?: string;
  /** Signale une valeur qui demande attention (retards, files pleines). */
  alert?: boolean;
}

interface MetricStripProps {
  items: WorkMetric[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Bandeau de chiffres de pilotage — archétype **Travail** (DIRECTION R6).
 *
 * Une **seule surface divisée** au lieu de quatre cartes flottantes séparées
 * par des gouttières, chacune avec son icône colorée. Les icônes ne portaient
 * aucune information que le libellé ne disait déjà, et les gouttières cassaient
 * l'alignement des nombres : à densité égale, la version en bandeau rend la
 * comparaison possible d'un coup d'œil, ce qui est le seul usage de ces chiffres.
 *
 * `tabular-nums` partout : les chiffres s'alignent verticalement d'une colonne
 * à l'autre.
 */
export function MetricStrip({ items, isLoading, className }: MetricStripProps) {
  const gridClass = cn(
    'grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-y-0',
    className,
  );

  if (isLoading) {
    return (
      <ul className={gridClass}>
        {items.map((item) => (
          <li key={item.label} className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-20" />
          </li>
        ))}
      </ul>
    );
  }

  // `ul`/`li` et non `dl` : une tuile cliquable enveloppe son libellé ET sa
  // valeur dans un `<a>`, or le modèle de contenu de `<dl>` n'admet que
  // `dt`/`dd` (éventuellement groupés dans un `div`) — jamais un `a`
  // intercalé. La liste reste sémantique et l'ancre reste valide.
  return (
    <ul className={gridClass}>
      {items.map((item) => {
        const body = (
          <>
            <span className="block text-xs font-medium text-muted-foreground">
              {item.label}
            </span>
            <span
              className={cn(
                'mt-1 block text-xl font-bold tabular-nums text-foreground',
                item.alert && 'text-warning',
              )}
            >
              {item.value}
            </span>
          </>
        );

        return (
          <li key={item.label} className="min-w-0">
            {item.href ? (
              <Link
                href={item.href}
                className="flex min-h-11 flex-col p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {body}
              </Link>
            ) : (
              <div className="p-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
