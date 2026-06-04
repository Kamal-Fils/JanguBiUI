'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Étiquette ARIA du groupe. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Barre de filtres horizontale (pastilles) scrollable — un seul rendu pour
 * articles/documents/users/agenda/org. État actif tokenisé + accessible.
 */
export function FilterPills({
  options,
  value,
  onChange,
  ariaLabel = 'Filtres',
  className,
}: FilterPillsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.97] motion-reduce:active:scale-100',
              active
                ? 'bg-primary text-primary-foreground shadow-soft-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground/70',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
