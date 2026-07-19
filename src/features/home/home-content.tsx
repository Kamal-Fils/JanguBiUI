'use client';

import { ContentContainer } from '@/components/layouts/content-container';

import { QuickAccessGrid } from './quick-access-grid';
import { WordOfTheDay } from './word-of-the-day';

interface HomeContentProps {
  /** Encart optionnel inséré entre la Parole du jour et les accès rapides. */
  widget?: React.ReactNode;
}

export function HomeContent({ widget }: HomeContentProps) {
  return (
    <ContentContainer>
      <div className="flex flex-col gap-8">
        <WordOfTheDay />
        {widget}
        <QuickAccessGrid />
      </div>
    </ContentContainer>
  );
}
