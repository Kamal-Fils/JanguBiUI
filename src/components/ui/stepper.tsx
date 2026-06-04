import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface StepperProps {
  steps: string[];
  /** Index de l'étape courante (0-based). */
  current: number;
  /** Rendre cliquables les étapes déjà complétées. */
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Progression d'assistant multi-étapes : segments + libellés.
 * Les étapes complétées sont navigables ; `aria-current` sur l'étape active.
 */
export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <ol className={cn('flex w-full items-center gap-2', className)}>
      {steps.map((label, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        const clickable = isDone && !!onStepClick;
        return (
          <li key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                isDone && 'bg-primary',
                isCurrent && 'bg-primary',
                !isDone && !isCurrent && 'bg-border',
                clickable && 'cursor-pointer hover:bg-primary/80',
              )}
            />
            <span
              className={cn(
                'flex items-center gap-1 truncate text-[11px]',
                isCurrent
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {isDone && <Check className="size-3 shrink-0" />}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
