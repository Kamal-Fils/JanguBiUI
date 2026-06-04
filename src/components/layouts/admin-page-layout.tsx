'use client';

import * as React from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
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
  /** Action principale (bouton). Rendue dans le toolbar EN TÊTE de contenu. */
  headerAction?: React.ReactNode;
  /** Barre de filtres / outils. Rendue dans le toolbar en tête de contenu. */
  toolbar?: React.ReactNode;
  width?: keyof typeof widthClass;
  children: React.ReactNode;
}

/**
 * Coquille des pages admin. Le titre/sous-titre sont fournis au shell via
 * `usePageMeta` (en-tête AppHeader : fil d'Ariane + titre). `headerAction` et
 * `toolbar` sont rendus DANS le contenu, en tête (le `PageHeader` partagé n'est
 * plus utilisé). Le shell applicatif (sidebar + bottom-nav) vient de
 * `app/app/layout.tsx`.
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
  useRegisterPageMeta({ title, subtitle });

  const body = (
    <div className={cn('mx-auto w-full px-4 py-6', widthClass[width])}>
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
    </div>
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
