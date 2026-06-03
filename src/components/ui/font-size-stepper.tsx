'use client';

import { Minus, Plus } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface FontSizeStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Réglage de la taille du texte de lecture — un seul composant pour les 4
 * toolbars dupliquées (Bible today/masse/books, reading-view).
 */
export function FontSizeStepper({
  value,
  onChange,
  min = 14,
  max = 26,
  step = 2,
  className,
}: FontSizeStepperProps) {
  return (
    <div
      role="group"
      aria-label="Taille du texte"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-background-surface p-0.5',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Réduire la taille du texte"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span
        className="w-6 text-center text-xs font-semibold tabular-nums text-foreground"
        aria-hidden="true"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter la taille du texte"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
