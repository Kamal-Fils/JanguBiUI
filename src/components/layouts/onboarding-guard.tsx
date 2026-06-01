'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { getRefreshToken } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Redirect to login only if there is no session token
      // (if token exists but query failed, the 401 handler manages the redirect)
      if (!getRefreshToken()) {
        router.replace(paths.auth.login.getHref(pathname));
      }
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

  // No token → waiting for redirect
  if (!user && !getRefreshToken()) return null;

  if (
    user?.onboarding_state === 'pending_email' ||
    user?.onboarding_state === 'pending_parish'
  ) {
    return null;
  }

  return <>{children}</>;
}
