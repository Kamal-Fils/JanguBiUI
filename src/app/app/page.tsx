import { AppShell } from '@/components/layouts/app-shell';
import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { HomeContent } from '@/features/home/home-content';

export default function HomePage() {
  return (
    <AppShell>
      <HomeContent widget={<DailyMysteryCard />} />
    </AppShell>
  );
}
