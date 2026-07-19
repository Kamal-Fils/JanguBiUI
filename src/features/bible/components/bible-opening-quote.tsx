import { ScriptureQuote } from '@/components/ui/scripture-quote';

/**
 * Citation d'ouverture de la section Bible — pose le ton éditorial.
 *
 * Elle n'apparaît QUE sur les écrans de navigation (liste des livres, Lectio,
 * parcours). Pendant la lecture d'un chapitre, le chrome s'efface : le texte
 * biblique est le seul sujet de l'écran (DIRECTION.md R6, archétype Lecture).
 */
export function BibleOpeningQuote({ className }: { className?: string }) {
  return (
    <ScriptureQuote
      eyebrow="Parole de Dieu"
      text="Au commencement était le Verbe, et le Verbe était Dieu."
      reference="Jean 1, 1"
      size="md"
      className={className}
    />
  );
}
