'use client';

import * as React from 'react';

export interface PageMeta {
  /** Titre de la page (app-bar mobile + bloc titre desktop + dernier crumb). */
  title: string;
  /** Sous-titre optionnel (affiché sous le titre). */
  subtitle?: string;
  /** Libellé du dernier crumb si différent du titre (routes dynamiques). */
  leafLabel?: string;
  /**
   * Affiche le bloc titre prominent dans l'en-tête (défaut true). Les routes
   * détail qui ont déjà un h1 dans leur contenu passent `false` — seul le fil
   * d'Ariane est alors rendu sur desktop.
   */
  showHeading?: boolean;
}

const PageMetaStateContext = React.createContext<PageMeta | null>(null);
const PageMetaSetContext = React.createContext<(meta: PageMeta | null) => void>(
  () => undefined,
);

/**
 * Fournit le contexte de métadonnées de page au shell. Les pages « migrées »
 * (qui ne rendent plus `<PageHeader>`) enregistrent leur titre via
 * `useRegisterPageMeta` ; le shell (`AppHeader`) le lit via `usePageMetaValue`.
 */
export function PageMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = React.useState<PageMeta | null>(null);
  return (
    <PageMetaSetContext.Provider value={setMeta}>
      <PageMetaStateContext.Provider value={meta}>
        {children}
      </PageMetaStateContext.Provider>
    </PageMetaSetContext.Provider>
  );
}

/** Lecture du meta courant (AppHeader / AppShell). */
export function usePageMetaValue(): PageMeta | null {
  return React.useContext(PageMetaStateContext);
}

/**
 * Enregistre le titre / fil d'Ariane de la page courante auprès du shell, et le
 * nettoie au démontage. À appeler dans une page/feature CLIENT migrée.
 */
export function useRegisterPageMeta(meta: PageMeta | null): void {
  const setMeta = React.useContext(PageMetaSetContext);
  const title = meta?.title;
  const subtitle = meta?.subtitle;
  const leafLabel = meta?.leafLabel;
  const showHeading = meta?.showHeading;

  React.useEffect(() => {
    setMeta(title ? { title, subtitle, leafLabel, showHeading } : null);
    return () => setMeta(null);
  }, [setMeta, title, subtitle, leafLabel, showHeading]);
}
