'use client';

import { DailyReadingCard } from './daily-reading-card';
import { QuickAccessGrid } from './quick-access-grid';
import { WelcomeBanner } from './welcome-banner';

interface HomeContentProps {
  /** Optional slot for a dashboard widget rendered between the daily reading and quick access grid. */
  widget?: React.ReactNode;
}

export function HomeContent({ widget }: HomeContentProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <div className="flex flex-col gap-6">
        <WelcomeBanner />
        <DailyReadingCard />
        {widget}
        <QuickAccessGrid />
      </div>
    </div>
  );
}
