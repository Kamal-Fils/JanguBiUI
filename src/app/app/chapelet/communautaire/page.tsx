'use client';

import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { paths } from '@/config/paths';
import type { CommunityRosary } from '@/features/chapelet/api/get-community-rosaries';
import { CommunityRosaryList } from '@/features/chapelet/components/community-rosary-list';
import { LiveRosarySession } from '@/features/chapelet/components/live-rosary-session';

export default function CommunautairePage() {
  const [joined, setJoined] = useState<CommunityRosary | null>(null);

  useRegisterPageMeta({
    title: joined ? 'Chapelet en cours' : 'Chapelet communautaire',
    backHref: paths.app.chapelet.getHref(),
  });

  return (
    <div className="flex flex-col">
      {joined ? (
        <ContentContainer className="overflow-y-auto">
          <LiveRosarySession
            // Remonter la session comme clé garantit un état neuf (socket,
            // intentions, participants) si l'on passe d'un chapelet à l'autre.
            key={joined.id}
            rosary={joined}
            onLeave={() => setJoined(null)}
          />
        </ContentContainer>
      ) : (
        <ContentContainer className="overflow-y-auto">
          <CommunityRosaryList onJoin={setJoined} />
        </ContentContainer>
      )}
    </div>
  );
}
