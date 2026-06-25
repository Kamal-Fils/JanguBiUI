'use client';

import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import type { CommunityRosary } from '@/features/chapelet/api/get-community-rosaries';
import { CommunityRosaryList } from '@/features/chapelet/components/community-rosary-list';

export default function CommunautairePage() {
  const [joined, setJoined] = useState<CommunityRosary | null>(null);

  useRegisterPageMeta({
    title: joined ? 'Chapelet en cours' : 'Chapelet communautaire',
  });

  return (
    <div className="flex flex-col">
      {joined ? (
        <ContentContainer width="narrow" className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm font-medium text-success">
              Vous participez au chapelet — décade {joined.current_decade}
            </p>
            {joined.intention && (
              <p className="mt-1 text-sm italic text-muted-foreground">
                {joined.intention}
              </p>
            )}
          </div>
          <button
            className="text-sm text-muted-foreground underline"
            onClick={() => setJoined(null)}
            type="button"
          >
            Revenir à la liste
          </button>
        </ContentContainer>
      ) : (
        <ContentContainer width="narrow" className="overflow-y-auto">
          <CommunityRosaryList onJoin={setJoined} />
        </ContentContainer>
      )}
    </div>
  );
}
