'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import {
  useRosaryGroups,
  RosaryGroup,
} from '@/features/chapelet/api/get-rosary-groups';
import { useRosaryToday } from '@/features/chapelet/api/get-rosary-today';

import { ChapeletGuide } from './chapelet-guide';
import { MysterySelector } from './mystery-selector';

export function ChapeletContent() {
  const { data: todayRosary, isLoading: isLoadingToday } = useRosaryToday();
  const { data: groups, isLoading: isLoadingGroups } = useRosaryGroups();

  const [selectedGroup, setSelectedGroup] = useState<RosaryGroup | null>(null);
  const [isGuideActive, setIsGuideActive] = useState(false);

  // Default to today's group if one hasn't been explicitly selected
  const activeGroup = selectedGroup || todayRosary?.day.group;

  if (isLoadingToday || isLoadingGroups) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!todayRosary || !groups || !activeGroup) {
    return null;
  }

  if (isGuideActive) {
    return (
      <div className="flex flex-col">
        <PageHeader
          title="Chapelet Guide"
          subtitle={`Mystères ${activeGroup.name}`}
        />
        <div className="mx-auto w-full max-w-3xl p-4">
          <ChapeletGuide
            group={activeGroup}
            todayRosary={todayRosary}
            onBack={() => setIsGuideActive(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Mon Chapelet Quotidien"
        subtitle="Méditez les mystères, dizaine après dizaine"
      />
      <div className="mx-auto w-full max-w-3xl p-4">
        <MysterySelector
          todayGroup={todayRosary.day.group}
          groups={groups}
          selectedGroup={activeGroup}
          onSelectGroup={setSelectedGroup}
          onStartGuide={() => setIsGuideActive(true)}
        />
      </div>
    </div>
  );
}
