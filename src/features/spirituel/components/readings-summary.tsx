'use client';

import { cn } from '@/utils/cn';
import { getReadingAccentClass } from '@/utils/reading-labels';

import type { Reading } from '../api/get-liturgy';
import { isGospel, readingAnchor, readingLabel } from '../utils/mass-readings';

interface ReadingsSummaryProps {
  readings: readonly Reading[];
}

/**
 * Sommaire des lectures du jour.
 *
 * DIRECTION R1 — le parcours prime : depuis l'accueil on vient souvent pour
 * l'Évangile seul, et sans sommaire il faut faire défiler trois lectures pour
 * l'atteindre. Une ancre par lecture supprime ce trajet. Le vocabulaire
 * (surtitre à gauche, citation en sérif à droite, filets fins) prolonge celui
 * de l'ouverture de l'accueil.
 */
export function ReadingsSummary({ readings }: ReadingsSummaryProps) {
  if (readings.length < 2) return null;

  return (
    <nav aria-label="Sommaire des lectures" className="mb-12">
      <ul className="flex flex-col divide-y divide-border/60 border-y border-border/60">
        {readings.map((reading) => {
          const label = readingLabel(reading);
          return (
            <li key={reading.id}>
              <a
                href={`#${readingAnchor(reading)}`}
                // py-3 + corps de texte ⇒ cible ≥ 44px (R3).
                className="group flex items-baseline justify-between gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span
                  className={cn(
                    'shrink-0 text-xs font-semibold uppercase tracking-[0.16em]',
                    isGospel(reading)
                      ? getReadingAccentClass(label)
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                <span className="min-w-0 flex-1 truncate text-right font-serif text-base text-foreground/90 underline-offset-4 group-hover:text-primary group-hover:underline">
                  {reading.citation || '—'}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
