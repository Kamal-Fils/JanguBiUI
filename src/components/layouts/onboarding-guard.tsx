'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.onboarding_state === 'pending_email') {
      router.replace(paths.onboarding.getHref());
      return;
    }

    if (user.onboarding_state === 'pending_parish') {
      router.replace(paths.onboarding.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  if (
    user?.onboarding_state === 'pending_email' ||
    user?.onboarding_state === 'pending_parish'
  ) {
    return null;
  }

  return <>{children}</>;
}
