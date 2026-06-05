import * as React from 'react';

import { cn } from '@/utils/cn';

const widthClass = {
  /** Recette standard de l'app (listes, dashboards, contenu courant). */
  default: 'max-w-2xl md:max-w-3xl lg:max-w-5xl',
  /** Long-form en mesure de lecture (~68ch) : corps d'article, liturgie. */
  reading: 'max-w-reading',
  /** Surfaces denses (dashboards riches, grilles larges). */
  wide: 'max-w-2xl md:max-w-3xl lg:max-w-6xl',
  /** Colonne étroite (formulaires courts, écrans focalisés). */
  narrow: 'max-w-2xl',
};

interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Largeur de contenu. Défaut : `default` (recette unique de l'app). */
  width?: keyof typeof widthClass;
}

/**
 * Conteneur de contenu standardisé : centre + largeur cohérente + gouttières
 * responsives. Remplace les recettes `mx-auto w-full max-w-…` divergentes
 * disséminées page par page (cf. Phase 2 — lot 2E d'adoption).
 */
export function ContentContainer({
  width = 'default',
  className,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 md:px-6 lg:px-8',
        widthClass[width],
        className,
      )}
      {...props}
    />
  );
}
