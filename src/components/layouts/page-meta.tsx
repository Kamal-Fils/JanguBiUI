'use client';

import * as React from 'react';

export interface PageMeta {
  /** Titre de la page (app-bar mobile + dernier crumb par défaut). */
  title: string;
  /** Libellé du dernier crumb si différent du titre (routes dynamiques). */
  leafLabel?: string;
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
  const leafLabel = meta?.leafLabel;

  React.useEffect(() => {
    setMeta(title ? { title, leafLabel } : null);
    return () => setMeta(null);
  }, [setMeta, title, leafLabel]);
}
