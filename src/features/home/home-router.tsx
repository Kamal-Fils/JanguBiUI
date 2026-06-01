'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAdmin(user) && !isClergy(user) && pathname === '/app') {
      router.replace(paths.app.admin.root.getHref());
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) return null;

  if (isAdmin(user) && !isClergy(user)) return null;

  if (isFidele(user)) return <FideleDashboard />;
  // isEvequeOrAbove before isClergy — évêque/archevêque are clergy but need a distinct dashboard
  if (isEvequeOrAbove(user)) return <EvequeeDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
