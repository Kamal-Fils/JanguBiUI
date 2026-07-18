import { Check } from 'lucide-react';
import * as React from 'react';

import type { StatusTone } from '@/components/ui/status-badge';
import { cn } from '@/utils/cn';

export interface TimelineStep {
  label: string;
  description?: React.ReactNode;
  timestamp?: React.ReactNode;
  /**
   * Acteur de l'étape, en libellé générique (« Par le secrétariat paroissial »).
   * Le composant ne connaît aucun rôle métier : la chaîne est fournie par la
   * feature appelante.
   */
  actor?: React.ReactNode;
  /**
   * Contenu riche rendu au pied du nœud (citation, formulaire de réponse…).
   * Permet de traiter une branche du workflow à l'endroit où elle se produit
   * plutôt que dans un encart détaché.
   */
  content?: React.ReactNode;
  /** Icône du nœud (défaut : check si done, point sinon). */
  icon?: React.ReactNode;
  state: 'done' | 'current' | 'upcoming';
  /** Couleur du nœud courant/terminal (défaut progress). */
  tone?: StatusTone;
}

const toneRing: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground/20 text-muted-foreground',
  info: 'bg-info/15 text-info ring-info/30',
  warning: 'bg-warning/15 text-warning ring-warning/30',
  progress: 'bg-primary/15 text-primary ring-primary/30',
  success: 'bg-success/15 text-success ring-success/30',
  danger: 'bg-destructive/15 text-destructive ring-destructive/30',
  accent: 'bg-accent/15 text-accent ring-accent/30',
};

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
  /**
   * Halo pulsant sur le nœud courant. Opt-in pour ne pas modifier les timelines
   * existantes ; toujours coupé sous `prefers-reduced-motion`.
   */
  animateCurrent?: boolean;
  /** Nom accessible de la liste (lecteurs d'écran). */
  'aria-label'?: string;
}

/**
 * Timeline verticale : ligne de connexion + nœuds colorés icône, l'étape
 * courante mise en relief par un anneau. Remplace le `<ol>` plat de points.
 */
export function StatusTimeline({
  steps,
  className,
  animateCurrent = false,
  'aria-label': ariaLabel = 'Progression',
}: StatusTimelineProps) {
  return (
    <ol className={cn('relative', className)} aria-label={ariaLabel}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const tone = step.tone ?? 'progress';
        const done = step.state === 'done';
        const current = step.state === 'current';
        return (
          <li
            key={`${step.label}-${i}`}
            aria-current={current ? 'step' : undefined}
            className="relative flex gap-3.5 pb-6 last:pb-0"
          >
            {/* Connecteur */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px',
                  done ? 'bg-primary/40' : 'bg-border',
                )}
              />
            )}
            {/* Nœud */}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                step.state === 'upcoming'
                  ? 'bg-muted text-muted-foreground'
                  : toneRing[tone],
                current && 'ring-offset-0 ring-2',
              )}
            >
              {current && animateCurrent && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-current opacity-40 motion-reduce:hidden"
                />
              )}
              <span className="relative flex items-center justify-center">
                {step.icon ??
                  (done ? (
                    <Check className="size-4" />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  ))}
              </span>
            </span>
            {/* Contenu */}
            <div
              className={cn('min-w-0 flex-1 pt-1', current && 'font-semibold')}
            >
              <p
                className={cn(
                  'text-sm',
                  step.state === 'upcoming'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {step.label}
              </p>
              {step.actor && (
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {step.actor}
                </p>
              )}
              {step.description && (
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {step.description}
                </p>
              )}
              {step.timestamp && (
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {step.timestamp}
                </p>
              )}
              {step.content && (
                <div className="font-normal">{step.content}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
