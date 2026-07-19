interface StepHeadingProps {
  /** Rang de l'étape dans le parcours, à partir de 1. */
  step: number;
  title: string;
}

/**
 * Titre d'étape du parcours de don.
 *
 * Numéroter les étapes n'est pas décoratif : le formulaire empilait cinq
 * champs de même poids, sans dire lesquels étaient des décisions et lesquels
 * avaient déjà une réponse par défaut. Le rang rend le trajet lisible d'un
 * coup d'œil — on voit qu'il y en a trois, et qu'on en est où (DIRECTION R1).
 *
 * Le numéro est `aria-hidden` : il est redondant avec l'ordre du document pour
 * un lecteur d'écran, qui entend déjà les titres dans la séquence.
 */
export function StepHeading({ step, title }: StepHeadingProps) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold tabular-nums text-primary-foreground"
      >
        {step}
      </span>
      {title}
    </h3>
  );
}
