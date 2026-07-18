'use client';

import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';

interface WizardStepperProps {
  /** Libellés des étapes, dans l'ordre d'affichage. */
  steps: readonly string[];
  /** Index (0-based) de l'étape courante. */
  current: number;
  /**
   * Retour vers une étape déjà franchie. Seules les étapes d'index `< current`
   * sont cliquables : on ne saute jamais en avant sans passer la validation de
   * l'étape en cours.
   */
  onStepSelect?: (index: number) => void;
  /** Libellé accessible du groupe de navigation. */
  label?: string;
  className?: string;
}

/**
 * Stepper nommé d'un tunnel multi-étapes (D3 — maquette 02).
 *
 * Sémantique ARIA : une **liste ordonnée d'étapes** dans un `<nav>`, et non un
 * `role="progressbar"`. Un progressbar décrit une valeur numérique non
 * interactive ; ici les étapes franchies sont des contrôles cliquables, donc
 * une liste + `aria-current="step"` est la sémantique correcte.
 *
 * Les repères visuels (pastille, libellé, filet) sont `aria-hidden` : le nom
 * accessible de chaque étape est porté par un unique texte `sr-only` explicite
 * (position, libellé, état) pour éviter la double lecture.
 */
export function WizardStepper({
  steps,
  current,
  onStepSelect,
  label = 'Progression de la demande',
  className,
}: WizardStepperProps) {
  return (
    <nav aria-label={label} className={cn('w-full', className)}>
      <ol className="flex w-full items-start">
        {steps.map((stepLabel, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const isClickable = isDone && Boolean(onStepSelect);
          const isLast = index === steps.length - 1;

          const state = isDone
            ? 'terminée'
            : isCurrent
              ? 'en cours'
              : 'à venir';
          const accessibleName = isClickable
            ? `Revenir à l'étape ${index + 1} sur ${steps.length} : ${stepLabel}`
            : `Étape ${index + 1} sur ${steps.length} : ${stepLabel}, ${state}`;

          const columnClass =
            'flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-lg py-1 sm:w-20';

          const bullet = (
            <span
              aria-hidden="true"
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-[11px] font-bold transition-colors',
                isDone && 'border-primary bg-primary text-primary-foreground',
                isCurrent &&
                  'border-primary bg-card text-primary ring-4 ring-primary/15',
                !isDone &&
                  !isCurrent &&
                  'border-border bg-muted text-muted-foreground',
              )}
            >
              {isDone ? <Check className="size-3.5" /> : index + 1}
            </span>
          );

          const caption = (
            <span
              aria-hidden="true"
              className={cn(
                'text-center text-[10px] leading-tight sm:text-xs',
                isCurrent
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {stepLabel}
            </span>
          );

          return (
            <li
              key={stepLabel}
              className={cn('flex items-start', !isLast && 'flex-1')}
            >
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(index)}
                  className={cn(
                    columnClass,
                    'transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  {bullet}
                  {caption}
                  <span className="sr-only">{accessibleName}</span>
                </button>
              ) : (
                <span
                  className={columnClass}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {bullet}
                  {caption}
                  <span className="sr-only">{accessibleName}</span>
                </span>
              )}

              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-4 h-0.5 min-w-3 flex-1 rounded-full transition-colors',
                    isDone ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
