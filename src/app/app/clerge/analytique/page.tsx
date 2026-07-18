'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { AnalyticsDashboard } from '@/features/analytics/components/analytics-dashboard';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

/**
 * Coquille de page : garde d'accès UX alignée sur les autres pages clergé
 * (le back reste la source de vérité — un clergé sans périmètre reçoit un 403
 * que le dashboard traduit en état vide explicatif).
 */
export default function AnalytiquePage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading || !isClergy(user)) return null;

  return <AnalyticsDashboard />;
}
