'use client';

import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { useUser } from '@/lib/auth';
import { isFidele } from '@/lib/authorization';

import { FideleDashboard } from './fidele-dashboard';
import { HomeContent } from './home-content';

export function HomeRouter() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;

  if (isFidele(user)) {
    return <FideleDashboard />;
  }

  return <HomeContent widget={<DailyMysteryCard />} />;
}
