'use client';

import * as React from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import type { User } from '@/lib/auth';

type ContentWidth = React.ComponentProps<typeof ContentContainer>['width'];

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  /** Prédicat de rôle ; si fourni, enveloppe le contenu dans un RoleGuard. */
  allow?: (user: User | null | undefined) => boolean;
  redirectTo?: string;
  /** Action principale (bouton). Rendue dans le toolbar EN TÊTE de contenu. */
  headerAction?: React.ReactNode;
  /** Barre de filtres / outils. Rendue dans le toolbar en tête de contenu. */
  toolbar?: React.ReactNode;
  /**
   * Largeur du CADRE de page — mêmes recettes que `ContentContainer`. Défaut :
   * `default`, comme tout écran de l'app. Une colonne de saisie plus étroite se
   * contraint À L'INTÉRIEUR (ex. `max-w-2xl` sur le formulaire), pas ici.
   */
  width?: ContentWidth;
  children: React.ReactNode;
}

/**
 * Coquille des pages admin. Le titre/sous-titre sont fournis au shell via
 * `usePageMeta` (en-tête AppHeader : fil d'Ariane + titre). `headerAction` et
 * `toolbar` sont rendus DANS le contenu, en tête. Le shell applicatif (sidebar
 * + bottom-nav) vient de `app/app/layout.tsx`.
 *
 * La largeur délègue à `ContentContainer` : une seule recette de cadre pour
 * TOUTE l'app, admin comprise (avant, cette coquille avait sa propre échelle
 * md/lg/xl/full et les pages admin ne s'alignaient sur aucun autre écran).
 */
export function AdminPageLayout({
  title,
  subtitle,
  allow,
  redirectTo,
  headerAction,
  toolbar,
  width = 'default',
  children,
}: AdminPageLayoutProps) {
  useRegisterPageMeta({ title, subtitle });

  const body = (
    <ContentContainer width={width}>
      {(toolbar || headerAction) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar ? (
            <div className="min-w-0 flex-1">{toolbar}</div>
          ) : (
            <div className="hidden sm:block" aria-hidden="true" />
          )}
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </ContentContainer>
  );

  if (allow) {
    return (
      <RoleGuard allow={allow} redirectTo={redirectTo}>
        {body}
      </RoleGuard>
    );
  }

  return body;
}
