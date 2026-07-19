import { cn } from '@/utils/cn';

interface EditorialRuleProps {
  className?: string;
}

/**
 * Filet éditorial **bleu** — respiration entre deux mouvements du fil.
 *
 * Remplace `.hairline-gold` dans l'archétype « Flux » : la direction veut le
 * bleu dominant et l'or en accent seulement. L'or reste réservé à la marque de
 * fin d'article et au badge « Lettre pastorale ».
 */
export function EditorialRule({ className }: EditorialRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent',
        className,
      )}
    />
  );
}
