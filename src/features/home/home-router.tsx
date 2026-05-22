'use client';

import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { useUser } from '@/lib/auth';
import { isClergy, isFidele } from '@/lib/authorization';

import { FideleDashboard } from './fidele-dashboard';
import { HomeContent } from './home-content';
import { PretreeDashboard } from './pretre-dashboard';

export function HomeRouter() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;

  if (isFidele(user)) return <FideleDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
