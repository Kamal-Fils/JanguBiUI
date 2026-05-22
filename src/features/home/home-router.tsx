'use client';

import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { useUser } from '@/lib/auth';
import { isClergy, isEvequeOrAbove, isFidele } from '@/lib/authorization';

import { EvequeeDashboard } from './eveque-dashboard';
import { FideleDashboard } from './fidele-dashboard';
import { HomeContent } from './home-content';
import { PretreeDashboard } from './pretre-dashboard';

export function HomeRouter() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;

  if (isFidele(user)) return <FideleDashboard />;
  // isEvequeOrAbove before isClergy — évêque/archevêque are clergy but need a distinct dashboard
  if (isEvequeOrAbove(user)) return <EvequeeDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
