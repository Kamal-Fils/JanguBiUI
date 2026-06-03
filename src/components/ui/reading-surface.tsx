import DOMPurify from 'isomorphic-dompurify';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface ReadingSurfaceProps {
  /** Taille de police en px (pilotée par FontSizeStepper). */
  fontSize?: number;
  /** Contenu HTML (assaini ici par DOMPurify). */
  html?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Surface de lecture longue canonique : typographie `prose` (dark-aware),
 * mesure unique (~68ch via max-w-reading) et interligne ~1.8. Source unique des
 * règles de lecture (Bible, liturgie, offices) au lieu de 4 réglages divergents.
 */
export function ReadingSurface({
  fontSize,
  html,
  children,
  className,
}: ReadingSurfaceProps) {
  const style: React.CSSProperties | undefined = fontSize
    ? { fontSize: `${fontSize}px`, lineHeight: 1.8 }
    : undefined;
  const classes = cn(
    'reading-content prose prose-slate max-w-reading dark:prose-invert',
    className,
  );

  if (html !== undefined) {
    return (
      <div
        className={classes}
        style={style}
        // Assaini juste au-dessus — sûr.
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
