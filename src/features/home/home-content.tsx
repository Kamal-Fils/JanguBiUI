'use client';

import { ContentContainer } from '@/components/layouts/content-container';

import { DailyReadingCard } from './daily-reading-card';
import { QuickAccessGrid } from './quick-access-grid';
import { WelcomeBanner } from './welcome-banner';

interface HomeContentProps {
  /** Optional slot for a dashboard widget rendered between the daily reading and quick access grid. */
  widget?: React.ReactNode;
}

export function HomeContent({ widget }: HomeContentProps) {
  return (
    <ContentContainer>
      <div className="flex flex-col gap-6">
        <WelcomeBanner />
        <DailyReadingCard />
        {widget}
        <QuickAccessGrid />
      </div>
    </ContentContainer>
  );
}
