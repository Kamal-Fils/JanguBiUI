/**
 * Classes Tailwind partagées par les champs du tunnel de demande.
 *
 * Centralisées pour que les quatre étapes rendent des champs strictement
 * identiques — un `input` d'une étape ne doit pas dériver visuellement de celui
 * d'une autre.
 */

export const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export const labelClass = 'text-sm font-medium text-foreground';

export const errorClass = 'mt-1 text-xs text-destructive';

/** Paire de champs : empilée sur mobile, 2 colonnes dès `sm` (fin du `flex gap-3` écrasé). */
export const fieldPairClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2';
