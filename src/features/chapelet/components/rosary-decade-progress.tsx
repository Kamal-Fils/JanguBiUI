'use client';

import { cn } from '@/utils/cn';

/** Un chapelet compte cinq dizaines ; `current_decade` part de 0 (ouverture). */
const TOTAL_DECADES = 5;

interface RosaryDecadeProgressProps {
  currentDecade: number;
}

function decadeLabel(decade: number): string {
  if (decade <= 0) return 'Ouverture';
  if (decade >= TOTAL_DECADES) return `Décade ${TOTAL_DECADES}`;
  return `Décade ${decade}`;
}

/**
 * Sujet de l'écran, lisible sans lire (R2) : la décade en cours occupe
 * l'échelle d'affichage, les dizaines franchies sont rappelées par des pastilles
 * doublées d'un libellé texte (jamais la couleur seule — WCAG 1.4.1).
 */
export function RosaryDecadeProgress({
  currentDecade,
}: RosaryDecadeProgressProps) {
  const clamped = Math.min(Math.max(currentDecade, 0), TOTAL_DECADES);
  const label = decadeLabel(currentDecade);

  return (
    <section
      aria-labelledby="rosary-decade-heading"
      className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-8 text-center"
    >
      <p className="text-caption font-medium uppercase tracking-widest text-primary">
        En prière ensemble
      </p>
      <p
        id="rosary-decade-heading"
        className="mt-2 font-serif text-display text-foreground"
      >
        {label}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TOTAL_DECADES}
        aria-valuenow={clamped}
        aria-valuetext={`${label} sur ${TOTAL_DECADES}`}
        className="mt-6 flex items-center justify-center gap-2"
      >
        {Array.from({ length: TOTAL_DECADES }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              'size-3 rounded-full border-2 transition-colors motion-reduce:transition-none',
              index < clamped
                ? 'border-primary bg-primary'
                : 'border-primary/30 bg-transparent',
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-caption text-muted-foreground">
        {clamped} dizaine{clamped > 1 ? 's' : ''} sur {TOTAL_DECADES}
      </p>
    </section>
  );
}
