'use client';

import { Link } from '@/components/ui/link/link';

/**
 * Pied de page de l'app — refonte V4-1 « layout classique » : une ligne sobre
 * en bas du main (desktop ET mobile ; le dégagement au-dessus de la bottom-nav
 * mobile est porté par la colonne de contenu du shell).
 */
export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Jàngu Bi — Numerisen · {year}</span>
        <nav aria-label="Liens de pied de page" className="flex items-center gap-4">
          <a
            href="mailto:contact@numerisen.sn"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </a>
          <Link href="/" className="hover:text-foreground">
            Site Jàngu Bi
          </Link>
        </nav>
      </div>
    </footer>
  );
}
