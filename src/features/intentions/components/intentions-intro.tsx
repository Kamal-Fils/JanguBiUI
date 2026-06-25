import { SectionHeader } from '@/components/ui/section-header';

/**
 * Copie explicative de l'objectif de la fonctionnalité « Intentions de messe ».
 * Source unique afin que le sens reste cohérent partout (page fidèle, accueil…).
 */
export const INTENTIONS_PURPOSE =
  'Confiez une intention de prière à votre paroisse ; le prêtre la prendra en charge et vous tiendra informé de sa célébration.';

interface IntentionsIntroProps {
  /** Niveau de titre rendu (défaut h2). */
  as?: 'h2' | 'h3';
  className?: string;
}

/**
 * En-tête éditorial de la section Intentions : surtitre + titre serif (via
 * SectionHeader) et un sous-titre qui rend l'objectif explicite, pour ne plus
 * laisser le fidèle sans repère sur ce qu'il fait ici.
 */
export function IntentionsIntro({ as = 'h2', className }: IntentionsIntroProps) {
  return (
    <SectionHeader
      eyebrow="Intentions de messe"
      title="Vos intentions de prière"
      description={INTENTIONS_PURPOSE}
      as={as}
      className={className}
    />
  );
}
