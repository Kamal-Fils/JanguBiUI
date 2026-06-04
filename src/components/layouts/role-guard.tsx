'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useUser, type User } from '@/lib/auth';

interface RoleGuardProps {
  /** Prédicat d'autorisation (ex. `canManageUsers` de `@/lib/authorization`). */
  allow: (user: User | null | undefined) => boolean;
  children: React.ReactNode;
  /** Redirection si connecté mais non autorisé (défaut /app). */
  redirectTo?: string;
  /** Affiché pendant le chargement de l'utilisateur. */
  loadingFallback?: React.ReactNode;
}

/**
 * Garde de rôle déclarative — remplace le pattern impératif
 * `useEffect(redirect) + return null` dupliqué dans ~12 pages, et fournit un
 * vrai état de chargement (au lieu d'un écran blanc).
 */
export function RoleGuard({
  allow,
  children,
  redirectTo = '/app',
  loadingFallback,
}: RoleGuardProps) {
  const { data: user, isLoading } = useUser();
  const router = useRouter();
  const authorized = allow(user);

  React.useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (!authorized) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, authorized, redirectTo, router]);

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      )
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
