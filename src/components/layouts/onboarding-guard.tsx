'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Le refresh token vit désormais dans un cookie HttpOnly : ce composant ne peut
 * plus tester sa présence pour savoir si une session existe (c'était le rôle de
 * `getRefreshToken()`).
 *
 * Le bon signal est `useUser()` lui-même, qui répond exactement à la question
 * posée — « le serveur me reconnaît-il ? » — au lieu de la deviner depuis un
 * artefact de stockage. Trois cas, tous couverts :
 *
 *  - session valide   → la requête /me/ aboutit, `user` est défini ;
 *  - session absente  → la requête est désactivée (état `anonymous` établi par
 *    api-client après un refresh rejeté), `isLoading` retombe à false sans user
 *    → on redirige ici ;
 *  - session expirée  → le handler 401 d'api-client redirige lui-même et laisse
 *    la requête en suspens, donc `isLoading` reste vrai et on n'affiche rien —
 *    pas de double redirection.
 *
 * L'access token en mémoire aurait été un moins bon signal : il est absent à
 * chaque cold load alors que la session, elle, est bien vivante.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(paths.auth.login.getHref(pathname));
      return;
    }

    if (user.onboarding_state === 'pending_email') {
      router.replace(paths.onboarding.getHref());
      return;
    }

    if (user.onboarding_state === 'pending_parish') {
      router.replace(paths.onboarding.getHref());
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) return null;

  // Pas d'utilisateur → redirection en cours, ne rien afficher.
  if (!user) return null;

  if (
    user?.onboarding_state === 'pending_email' ||
    user?.onboarding_state === 'pending_parish'
  ) {
    return null;
  }

  return <>{children}</>;
}
