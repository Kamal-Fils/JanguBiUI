'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import type { CommunityRosary } from '@/features/chapelet/api/get-community-rosaries';
import { CommunityRosaryList } from '@/features/chapelet/components/community-rosary-list';

export default function CommunautairePage() {
  const [joined, setJoined] = useState<CommunityRosary | null>(null);

  if (joined) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Chapelet en cours" />
        <div className="flex-1 p-6 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              Vous participez au chapelet — décade {joined.current_decade}
            </p>
            {joined.intention && (
              <p className="mt-1 text-sm text-gray-600 italic">
                {joined.intention}
              </p>
            )}
          </div>
          <button
            className="text-sm text-gray-500 underline"
            onClick={() => setJoined(null)}
            type="button"
          >
            Revenir à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Chapelet communautaire" />
      <div className="flex-1 p-4 overflow-y-auto">
        <CommunityRosaryList onJoin={setJoined} />
      </div>
    </div>
  );
}
