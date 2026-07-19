'use client';

import { ReadingSurface } from '@/components/ui/reading-surface';
import { cn } from '@/utils/cn';
import { getReadingAccentClass } from '@/utils/reading-labels';

import type { Reading } from '../api/get-liturgy';
import { isGospel, readingAnchor, readingLabel } from '../utils/mass-readings';

interface ReadingArticleProps {
  reading: Reading;
  /** Taille de lecture, pilotée par le `FontSizeStepper` de l'écran. */
  fontSize: number;
}

/**
 * Une lecture de la messe, traitée en **archétype Lecture** : le texte est le
 * sujet. Mesure ~68ch et interligne généreux viennent de `ReadingSurface` ;
 * l'échelle distingue l'Évangile — qui porte le jour — des autres lectures.
 */
export function ReadingArticle({ reading, fontSize }: ReadingArticleProps) {
  const label = readingLabel(reading);
  const gospel = isGospel(reading);

  return (
    <article
      id={readingAnchor(reading)}
      aria-labelledby={`${readingAnchor(reading)}-titre`}
      // scroll-mt : le sommaire pointe ici, on dégage la barre d'app.
      className={cn(
        'scroll-mt-24',
        // R5 — la profondeur vient de la surface, pas d'un empilement d'ombres.
        gospel &&
          'rounded-3xl border border-border/70 bg-paper px-5 py-8 shadow-soft sm:px-8',
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-[0.18em]',
          getReadingAccentClass(label),
        )}
      >
        {label}
      </p>

      <h2
        id={`${readingAnchor(reading)}-titre`}
        className={cn(
          'mt-2 font-serif font-bold tracking-tight text-foreground',
          gospel ? 'text-headline' : 'text-title',
        )}
      >
        {reading.citation || label}
      </h2>

      {gospel && <div className="hairline-gold mt-5" aria-hidden="true" />}

      {reading.text ? (
        <ReadingSurface
          fontSize={fontSize}
          html={reading.text}
          className="mt-5"
        />
      ) : null}
    </article>
  );
}
