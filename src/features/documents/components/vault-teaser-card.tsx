import { ChevronRight } from 'lucide-react';

/**
 * Compteur affiché au fidèle. Il est calculé sur les demandes chargées par le
 * hub : si la liste est paginée, il peut sous-compter. La formulation reste
 * donc factuelle (« conservés à vie ») sans promettre un total exhaustif —
 * l'ouverture du coffre-fort donne la liste réelle.
 */
function vaultSubtitle(count: number | undefined): string {
  if (!count) {
    return 'Vos documents délivrés y sont conservés à vie et téléchargeables.';
  }
  const plural = count > 1 ? 's' : '';
  return `${count} document${plural} délivré${plural}, conservé${plural} à vie et téléchargeable${plural}.`;
}

interface VaultTeaserCardProps {
  /** Nombre de documents déposés visibles depuis le hub. */
  count?: number;
  /** Ouvre le coffre-fort (vue locale de la page Documents). */
  onOpen: () => void;
}

/**
 * Accès permanent au coffre-fort depuis le hub. Remplace l'onglet de même
 * niveau que « Mes demandes » : le coffre n'est plus une moitié de la page
 * masquée par défaut, mais une destination valorisée (sceau, filet or).
 */
export function VaultTeaserCard({ count, onOpen }: VaultTeaserCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-to-br from-accent/10 to-background-surface p-4 text-left shadow-soft-sm transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-accent/15 font-serif text-lg text-gold-ink"
      >
        ✠
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[15px] font-bold text-foreground">
          Coffre-fort numérique
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {vaultSubtitle(count)}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
        Ouvrir
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
