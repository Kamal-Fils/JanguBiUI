'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';
import { getLiturgicalTone } from '@/utils/liturgical-color';

interface LiturgicalHeaderProps {
  /** Titre de l'écran — le sujet, à l'échelle display (R2). */
  title: string;
  /** Temps liturgique renvoyé par l'AELF (ex. « Temps ordinaire »). */
  season?: string | null;
  /** Nom du jour (ex. « Mardi de la 15e semaine du temps ordinaire »). */
  dayName?: string | null;
  /** Date ISO du jour liturgique ; défaut : aujourd'hui. */
  date?: string | null;
  /** Outils de lecture posés sur le filet (ex. `FontSizeStepper`). */
  tools?: React.ReactNode;
  className?: string;
}

function formatDay(date?: string | null): string {
  const parsed = date ? new Date(date) : new Date();
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return safe.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Ouverture des écrans de lecture spirituelle.
 *
 * Le **marqueur liturgique reste discret** (DIRECTION R4) : une pastille et un
 * surtitre, jamais un lavis qui mangerait le bleu de l'identité. La hiérarchie
 * est portée par l'échelle (R2) — titre en `text-display`, contexte en corps
 * lisible — et non par de la couleur ou des cadres.
 */
export function LiturgicalHeader({
  title,
  season,
  dayName,
  date,
  tools,
  className,
}: LiturgicalHeaderProps) {
  const tone = getLiturgicalTone(season);

  return (
    <header className={cn('mb-10', className)}>
      <p
        className={cn(
          'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]',
          tone.inkClass,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block size-2 shrink-0 rounded-full',
            tone.dotClass,
          )}
        />
        {tone.label}
      </p>

      <h1 className="mt-3 font-serif text-display font-black leading-[0.95] tracking-tight text-foreground">
        {title}
      </h1>

      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        <span className="capitalize">{formatDay(date)}</span>
        {dayName ? <span className="block sm:inline"> · {dayName}</span> : null}
      </p>

      <div className="mt-6 flex items-center gap-4">
        <div className="hairline-gold min-w-0 flex-1" aria-hidden="true" />
        {tools}
      </div>
    </header>
  );
}
