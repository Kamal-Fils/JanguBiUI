import * as React from 'react';

import { cn } from '@/utils/cn';

interface ScriptureQuoteProps {
  /** Texte de la citation (verset, prière, parole). */
  text: string;
  /** Référence affichée en pied (ex. « Jean 3, 16 »). */
  reference?: string;
  /** Surtitre majuscule optionnel (ex. « Évangile du jour »). */
  eyebrow?: string;
  /** Taille de la citation. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Tailles de la citation, en serif léger pour un rendu éditorial.
const SIZE_CLASSES: Record<NonNullable<ScriptureQuoteProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-display',
};

/**
 * Citation scripturaire éditoriale : filet or à gauche, texte serif italique,
 * surtitre majuscule optionnel et référence en pied. Purement présentationnel.
 */
export function ScriptureQuote({
  text,
  reference,
  eyebrow,
  size = 'md',
  className,
}: ScriptureQuoteProps) {
  return (
    <blockquote className={cn('border-l-[3px] border-gold pl-5', className)}>
      {eyebrow && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
          {eyebrow}
        </p>
      )}
      <p
        className={cn(
          'font-serif font-light italic leading-relaxed text-foreground/85',
          SIZE_CLASSES[size],
        )}
      >
        {text}
      </p>
      {reference && (
        <cite className="mt-3 block text-caption not-italic text-muted-foreground">
          {reference}
        </cite>
      )}
    </blockquote>
  );
}
