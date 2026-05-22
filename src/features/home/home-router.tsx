'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isAdmin, isClergy, isEvequeOrAbove, isFidele } from '@/lib/authorization';

import { EvequeeDashboard } from './eveque-dashboard';
import { FideleDashboard } from './fidele-dashboard';
import { HomeContent } from './home-content';
import { PretreeDashboard } from './pretre-dashboard';

export function HomeRouter() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAdmin(user) && !isClergy(user)) {
      router.replace(paths.app.admin.root.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  if (isAdmin(user) && !isClergy(user)) return null;

  if (isFidele(user)) return <FideleDashboard />;
  if (isEvequeOrAbove(user)) return <EvequeeDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
