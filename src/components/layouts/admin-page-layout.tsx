import * as React from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { RoleGuard } from '@/components/layouts/role-guard';
import type { User } from '@/lib/auth';
import { cn } from '@/utils/cn';

const widthClass = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  full: 'max-w-7xl',
};

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  /** Prédicat de rôle ; si fourni, enveloppe le contenu dans un RoleGuard. */
  allow?: (user: User | null | undefined) => boolean;
  redirectTo?: string;
  /** Action d'en-tête (bouton principal). */
  headerAction?: React.ReactNode;
  /** Barre de filtres / outils sous l'en-tête. */
  toolbar?: React.ReactNode;
  width?: keyof typeof widthClass;
  children: React.ReactNode;
}

/**
 * Coquille unifiée des pages admin : AppShell + PageHeader + conteneur de
 * largeur cohérente (+ RoleGuard optionnel). Remplace le `max-w-*` choisi au
 * hasard sur chaque page admin.
 */
export function AdminPageLayout({
  title,
  subtitle,
  allow,
  redirectTo,
  headerAction,
  toolbar,
  width = 'xl',
  children,
}: AdminPageLayoutProps) {
  const body = (
    <div className="flex flex-1 flex-col">
      <PageHeader title={title} subtitle={subtitle} action={headerAction} />
      <div className={cn('mx-auto w-full px-4 py-6', widthClass[width])}>
        {toolbar && <div className="mb-5">{toolbar}</div>}
        {children}
      </div>
    </div>
  );

  return (
    <AppShell>
      {allow ? (
        <RoleGuard allow={allow} redirectTo={redirectTo}>
          {body}
        </RoleGuard>
      ) : (
        body
      )}
    </AppShell>
  );
}
