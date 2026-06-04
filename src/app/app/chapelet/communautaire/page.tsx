'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import type { CommunityRosary } from '@/features/chapelet/api/get-community-rosaries';
import { CommunityRosaryList } from '@/features/chapelet/components/community-rosary-list';

export default function CommunautairePage() {
  const [joined, setJoined] = useState<CommunityRosary | null>(null);

  return (
    <div className="flex flex-col">
      {joined ? (
        <>
          <PageHeader title="Chapelet en cours" />
          <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 space-y-4">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4">
              <p className="text-sm font-medium text-success">
                Vous participez au chapelet — décade {joined.current_decade}
              </p>
              {joined.intention && (
                <p className="mt-1 text-sm text-muted-foreground italic">
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
          </div>
        </>
      ) : (
        <>
          <PageHeader title="Chapelet communautaire" />
          <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 overflow-y-auto">
            <CommunityRosaryList onJoin={setJoined} />
          </div>
        </>
      )}
    </div>
  );
}
